"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Building2, Plus, Upload } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { SearchBar } from "@/components/ui/search-bar";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CustomerFormDialog } from "@/components/customers/customer-form-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { KpiCard } from "@/components/ui/kpi-card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatCurrency, formatDate, getInitials } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { useCRMStore, usePermissions } from "@/store/CRMStoreProvider";
import { customerService } from "@/services";
import type { Customer } from "@/types";
import { toast } from "sonner";

export default function CustomersPage() {
  const { getCustomers, getTeamCustomerOwners, getTeamCustomersSummary } = useCRMStore();
  const { canEdit, role } = usePermissions();
  const customers = getCustomers();
  const isManager = role === "sales_manager";
  const teamOwners = isManager ? getTeamCustomerOwners() : [];
  const teamSummary = isManager ? getTeamCustomersSummary() : null;

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [industry, setIndustry] = useState("all");
  const [ownerId, setOwnerId] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | undefined>();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const pageSize = 5;

  const industries = [...new Set(customers.map((c) => c.industry))];

  const filtered = useMemo(() => {
    let result = customers.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.contactName.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = status === "all" || c.status === status;
      const matchesIndustry = industry === "all" || c.industry === industry;
      const matchesOwner = ownerId === "all" || c.ownerId === ownerId;
      return matchesSearch && matchesStatus && matchesIndustry && matchesOwner;
    });
    result = [...result].sort((a, b) => {
      if (sortBy === "revenue") return b.revenue - a.revenue;
      if (sortBy === "activity") return b.lastActivity.localeCompare(a.lastActivity);
      return a.name.localeCompare(b.name);
    });
    return result;
  }, [customers, search, status, industry, ownerId, sortBy]);

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  function openCreate() {
    setEditCustomer(undefined);
    setFormOpen(true);
  }

  function openEdit(customer: Customer) {
    setEditCustomer(customer);
    setFormOpen(true);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={role === "salesperson" ? "My Customers" : isManager ? "Team Customers" : "Customers"}
        description={
          isManager
            ? "View and manage customers owned by your team."
            : "Manage customers and track relationships."
        }
        actions={
          canEdit ? (
            <>
              <Button variant="outline" disabled title="Import available in backend phase">
                <Upload className="h-4 w-4" />
                Import
              </Button>
              <Button variant="accent" onClick={openCreate}>
                <Plus className="h-4 w-4" />
                Add Customer
              </Button>
            </>
          ) : undefined
        }
      />

      {isManager && teamSummary ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Team Customers" value={String(teamSummary.totalCustomers)} featured />
          <KpiCard label="Active Customers" value={String(teamSummary.activeCustomers)} />
          <KpiCard label="Team Revenue" value={formatCurrency(teamSummary.totalRevenue)} />
          <KpiCard label="Active Deals" value={String(teamSummary.totalActiveDeals)} />
        </div>
      ) : null}

      <Card className="p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <SearchBar placeholder="Search customers..." value={search} onChange={setSearch} className="flex-1" />
          <div className="flex flex-wrap gap-2">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full sm:w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={industry} onValueChange={setIndustry}>
              <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="Industry" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Industries</SelectItem>
                {industries.map((ind) => (
                  <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isManager ? (
              <Select value={ownerId} onValueChange={setOwnerId}>
                <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Salesperson" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Team Members</SelectItem>
                  {teamOwners.map((owner) => (
                    <SelectItem key={owner.id} value={owner.id}>{owner.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-[140px]"><SelectValue placeholder="Sort" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="revenue">Revenue</SelectItem>
                <SelectItem value="activity">Last Activity</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No customers found"
          description={
            isManager
              ? "No team customers match your search or filters."
              : "Add your first customer to start building relationships."
          }
          actionLabel={canEdit ? "Add Customer" : undefined}
          onAction={canEdit ? openCreate : undefined}
        />
      ) : (
        <Card>
          <div className="divide-y md:hidden">
            {paginated.map((customer) => (
              <div key={customer.id} className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link href={`/customers/${customer.id}`} className="font-medium hover:underline">
                      {customer.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">{customer.location}</p>
                  </div>
                  <StatusBadge status={customer.status} />
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Contact</p>
                    <p className="truncate">{customer.contactName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Revenue</p>
                    <p className="font-medium">{formatCurrency(customer.revenue)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Owner</p>
                    <p className="truncate">{customer.owner}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Active Deals</p>
                    <p>{customer.activeDeals}</p>
                  </div>
                </div>
                {canEdit && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" asChild>
                      <Link href={`/customers/${customer.id}`}>View</Link>
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(customer)}>
                      Edit
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="hidden overflow-x-auto md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Active Deals</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Last Activity</TableHead>
                  <TableHead>Status</TableHead>
                  {canEdit && <TableHead className="w-10" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <Link href={`/customers/${customer.id}`} className="font-medium hover:underline">
                        {customer.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">{customer.location}</p>
                    </TableCell>
                    <TableCell>
                      <p>{customer.contactName}</p>
                      <p className="text-xs text-muted-foreground">{customer.contactEmail}</p>
                    </TableCell>
                    <TableCell>{customer.industry}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="text-[10px]">{getInitials(customer.owner)}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{customer.owner}</span>
                      </div>
                    </TableCell>
                    <TableCell>{customer.activeDeals}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(customer.revenue)}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(customer.lastActivity)}</TableCell>
                    <TableCell><StatusBadge status={customer.status} /></TableCell>
                    {canEdit && (
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/customers/${customer.id}`}>View</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEdit(customer)}>Edit</DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setDeleteId(customer.id)}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 sm:flex-none" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</Button>
              <Button variant="outline" size="sm" className="flex-1 sm:flex-none" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
            </div>
          </div>
        </Card>
      )}

      <CustomerFormDialog open={formOpen} onOpenChange={setFormOpen} customer={editCustomer} />
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Delete customer?"
        description="This will permanently remove the customer and related data from your demo workspace."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={async () => {
          if (deleteId) {
            await customerService.deleteCustomer(deleteId);
            toast.success("Customer deleted successfully");
          }
        }}
      />
    </div>
  );
}
