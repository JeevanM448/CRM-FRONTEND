"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Handshake, Plus, MoreHorizontal } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { SearchBar } from "@/components/ui/search-bar";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DealFormDialog } from "@/components/deals/deal-form-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card } from "@/components/ui/card";
import { KpiCard } from "@/components/ui/kpi-card";
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
import { formatCurrency, formatDate } from "@/lib/utils";
import { useCRMStore, usePermissions } from "@/store/CRMStoreProvider";
import { dealService } from "@/services";
import type { Deal } from "@/types";
import { toast } from "sonner";

export default function DealsPage() {
  const { getDeals, getCustomers, getTeamDealOwners, getTeamDealsSummary } = useCRMStore();
  const { canEdit, canDeleteDeals, role } = usePermissions();
  const deals = getDeals();
  const isManager = role === "sales_manager";
  const teamOwners = isManager ? getTeamDealOwners() : [];
  const teamSummary = isManager ? getTeamDealsSummary() : null;

  const [search, setSearch] = useState("");
  const [stage, setStage] = useState("all");
  const [owner, setOwner] = useState("all");
  const [ownerId, setOwnerId] = useState("all");
  const [customerFilter, setCustomerFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editDeal, setEditDeal] = useState<Deal | undefined>();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const owners = [...new Set(deals.map((d) => d.owner))];
  const customers = getCustomers();

  const filtered = useMemo(() => {
    return deals.filter((d) => {
      const matchesSearch =
        d.title.toLowerCase().includes(search.toLowerCase()) ||
        d.customerName.toLowerCase().includes(search.toLowerCase());
      const matchesStage = stage === "all" || d.stage === stage;
      const matchesOwner = isManager
        ? ownerId === "all" || d.ownerId === ownerId
        : owner === "all" || d.owner === owner;
      const matchesCustomer = customerFilter === "all" || d.customerId === customerFilter;
      return matchesSearch && matchesStage && matchesOwner && matchesCustomer;
    });
  }, [deals, search, stage, owner, ownerId, customerFilter, isManager]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={role === "salesperson" ? "My Deals" : isManager ? "Team Deals" : "Deals"}
        description={
          isManager
            ? "Track and manage sales opportunities across your team."
            : "Track and manage your sales opportunities."
        }
        actions={
          canEdit ? (
            <Button variant="accent" onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4" />
              New Deal
            </Button>
          ) : undefined
        }
      />

      {isManager && teamSummary ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-6">
          <KpiCard label="Team Deals" value={String(teamSummary.totalDeals)} featured />
          <KpiCard label="Pipeline Value" value={formatCurrency(teamSummary.pipelineValue)} />
          <KpiCard label="Won Value" value={formatCurrency(teamSummary.wonValue)} />
          <KpiCard label="Win Rate" value={`${teamSummary.winRate}%`} subValue={teamSummary.wonCount + teamSummary.lostCount > 0 ? `${teamSummary.wonCount} won` : "No closed deals"} />
          <KpiCard label="Active Deals" value={String(teamSummary.activeCount)} />
          <KpiCard label="Avg Deal Value" value={formatCurrency(teamSummary.averageDealValue)} />
        </div>
      ) : null}

      <Card className="p-4">
        <div className="flex flex-col gap-4 lg:flex-row">
          <SearchBar placeholder="Search deals..." value={search} onChange={setSearch} className="flex-1" />
          <div className="flex flex-wrap gap-2">
            <Select value={stage} onValueChange={setStage}>
              <SelectTrigger className="w-full sm:w-[150px]"><SelectValue placeholder="Stage" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                <SelectItem value="new">New Lead</SelectItem>
                <SelectItem value="qualified">Qualified</SelectItem>
                <SelectItem value="quotation">Quotation</SelectItem>
                <SelectItem value="negotiation">Negotiation</SelectItem>
                <SelectItem value="won">Won</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
              </SelectContent>
            </Select>
            <Select value={isManager ? ownerId : owner} onValueChange={isManager ? setOwnerId : setOwner}>
              <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="Owner" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Owners</SelectItem>
                {isManager
                  ? teamOwners.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)
                  : owners.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={customerFilter} onValueChange={setCustomerFilter}>
              <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Customer" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Customers</SelectItem>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Handshake}
          title="No deals found"
          description={
            isManager
              ? "No team deals match your search or filters."
              : "Create a new deal or adjust your filters."
          }
          actionLabel={canEdit ? "New Deal" : undefined}
          onAction={canEdit ? () => setFormOpen(true) : undefined}
        />
      ) : (
        <Card>
          <div className="divide-y md:hidden">
            {filtered.map((deal) => (
              <div key={deal.id} className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link href={`/deals/${deal.id}`} className="font-medium hover:underline">
                      {deal.title}
                    </Link>
                    <p className="text-sm text-muted-foreground">{deal.customerName}</p>
                  </div>
                  <StatusBadge status={deal.stage} type="stage" />
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Value</p>
                    <p className="font-medium">{formatCurrency(deal.value)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Probability</p>
                    <p>{deal.probability}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Owner</p>
                    <p className="truncate">{deal.owner}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Expected Close</p>
                    <p>{formatDate(deal.expectedClose)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="hidden overflow-x-auto md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Deal</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Probability</TableHead>
                  <TableHead>Expected Close</TableHead>
                  <TableHead>Last Activity</TableHead>
                  {canEdit && <TableHead className="w-10" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((deal) => (
                  <TableRow key={deal.id}>
                    <TableCell>
                      <Link href={`/deals/${deal.id}`} className="font-medium hover:underline">{deal.title}</Link>
                    </TableCell>
                    <TableCell>{deal.customerName}</TableCell>
                    <TableCell>{deal.owner}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(deal.value)}</TableCell>
                    <TableCell><StatusBadge status={deal.stage} type="stage" /></TableCell>
                    <TableCell>{deal.probability}%</TableCell>
                    <TableCell>{formatDate(deal.expectedClose)}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(deal.lastActivity)}</TableCell>
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
                              <Link href={`/deals/${deal.id}`}>View</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setEditDeal(deal); setFormOpen(true); }}>Edit</DropdownMenuItem>
                            {canDeleteDeals ? (
                              <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(deal.id)}>
                                Delete
                              </DropdownMenuItem>
                            ) : null}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      <DealFormDialog open={formOpen} onOpenChange={(open) => { setFormOpen(open); if (!open) setEditDeal(undefined); }} deal={editDeal} />
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Delete deal?"
        description="This deal will be permanently removed."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={async () => {
          if (deleteId) {
            await dealService.deleteDeal(deleteId);
            toast.success("Deal deleted successfully");
          }
        }}
      />
    </div>
  );
}
