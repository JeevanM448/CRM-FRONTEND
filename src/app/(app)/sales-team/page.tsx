"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, UsersRound } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { KpiCard } from "@/components/ui/kpi-card";
import { SearchBar } from "@/components/ui/search-bar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { PerformanceBadge } from "@/components/sales-team/performance-badge";
import { SalespersonFormDialog } from "@/components/sales-team/salesperson-form-dialog";
import { ManagerFormDialog } from "@/components/sales-team/manager-form-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { formatCurrency, getInitials } from "@/lib/utils";
import { useCRMStore, usePermissions } from "@/store/CRMStoreProvider";
import type { PerformanceStatus } from "@/store/salesTeam";

export default function SalesTeamPage() {
  const router = useRouter();
  const { canCreateUsers } = usePermissions();
  const { getSalesTeamOverview, getSalesTeamRows, getSalesManagers, getManagerRows } = useCRMStore();
  const overview = getSalesTeamOverview();
  const rows = getSalesTeamRows();
  const managers = getSalesManagers();
  const managerRows = getManagerRows();

  const [search, setSearch] = useState("");
  const [team, setTeam] = useState("all");
  const [managerId, setManagerId] = useState("all");
  const [status, setStatus] = useState("all");
  const [performance, setPerformance] = useState("all");
  const [salespersonFormOpen, setSalespersonFormOpen] = useState(false);
  const [managerFormOpen, setManagerFormOpen] = useState(false);

  const teams = useMemo(
    () => [
      ...new Set(
        [...rows.map((row) => row.team), ...managerRows.map((row) => row.team)].filter(
          (name) => Boolean(name) && name !== "—"
        )
      ),
    ],
    [rows, managerRows]
  );

  const filteredManagers = useMemo(() => {
    const q = search.toLowerCase();
    return managerRows.filter((row) => {
      const matchesSearch =
        row.name.toLowerCase().includes(q) ||
        row.email.toLowerCase().includes(q) ||
        row.team.toLowerCase().includes(q);
      const matchesTeam = team === "all" || row.team === team;
      const matchesStatus = status === "all" || row.status === status;
      return matchesSearch && matchesTeam && matchesStatus;
    });
  }, [managerRows, search, team, status]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rows.filter((row) => {
      const matchesSearch =
        row.name.toLowerCase().includes(q) ||
        row.email.toLowerCase().includes(q) ||
        row.team.toLowerCase().includes(q) ||
        row.managerName.toLowerCase().includes(q);
      const matchesTeam = team === "all" || row.team === team;
      const matchesManager = managerId === "all" || row.managerId === managerId;
      const matchesStatus = status === "all" || row.status === status;
      const matchesPerf = performance === "all" || row.performance === performance;
      return matchesSearch && matchesTeam && matchesManager && matchesStatus && matchesPerf;
    });
  }, [rows, search, team, managerId, status, performance]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales Team"
        description="Monitor sales performance and manage your sales organization."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <KpiCard label="Total Salespeople" value={String(overview.totalSalespeople)} />
        <KpiCard label="Total Sales" value={formatCurrency(overview.totalSales)} featured />
        <KpiCard label="Total Pipeline" value={formatCurrency(overview.totalPipeline)} />
        <KpiCard
          label="Target Achievement"
          value={`${overview.targetAchievement}%`}
          progress={Math.min(100, overview.targetAchievement)}
        />
        <KpiCard label="Won Deals" value={String(overview.wonDeals)} />
        <KpiCard label="Active Deals" value={String(overview.activeDeals)} />
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap">
        <SearchBar
          placeholder="Search managers or salespeople"
          value={search}
          onChange={setSearch}
          className="lg:max-w-sm"
        />
        <Select value={managerId} onValueChange={setManagerId}>
          <SelectTrigger className="w-full lg:w-48">
            <SelectValue placeholder="Manager" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All managers</SelectItem>
            {managers.map((manager) => (
              <SelectItem key={manager.id} value={manager.id}>
                {manager.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={team} onValueChange={setTeam}>
          <SelectTrigger className="w-full lg:w-44">
            <SelectValue placeholder="Team" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All teams</SelectItem>
            {teams.map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-full lg:w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Select value={performance} onValueChange={setPerformance}>
          <SelectTrigger className="w-full lg:w-44">
            <SelectValue placeholder="Performance" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All performance</SelectItem>
            <SelectItem value="on_track">On track</SelectItem>
            <SelectItem value="watch">Watch</SelectItem>
            <SelectItem value="behind">Behind</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold">Managers</h2>
          {canCreateUsers ? (
            <Button variant="accent" onClick={() => setManagerFormOpen(true)}>
              <Plus className="h-4 w-4" />
              Add Manager
            </Button>
          ) : null}
        </div>
        {filteredManagers.length === 0 ? (
          <EmptyState
            icon={UsersRound}
            title="No managers found"
            description="Try a different search or filter."
          />
        ) : (
          <>
            <div className="space-y-3 md:hidden">
              {filteredManagers.map((row) => (
                <Link key={row.id} href={`/sales-team/manager/${row.id}`}>
                  <Card className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{row.name}</p>
                        <p className="text-sm text-muted-foreground break-all">{row.email}</p>
                        <p className="text-sm text-muted-foreground">{row.team}</p>
                      </div>
                      <StatusBadge status={row.status} />
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                      <p>Members: {row.memberCount}</p>
                      <p>Sales: {formatCurrency(row.totalSales)}</p>
                      <p>Target: {formatCurrency(row.targetAmount)}</p>
                      <p>Achievement: {row.targetAchievement}%</p>
                      <p>Pipeline: {formatCurrency(row.totalPipeline)}</p>
                      <p>Active / won: {row.activeDeals} / {row.wonDeals}</p>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
            <Card className="hidden overflow-hidden md:block">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Manager</TableHead>
                      <TableHead>Team</TableHead>
                      <TableHead>Members</TableHead>
                      <TableHead>Team sales</TableHead>
                      <TableHead>Team target</TableHead>
                      <TableHead>Achievement</TableHead>
                      <TableHead>Pipeline</TableHead>
                      <TableHead>Active / won</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredManagers.map((row) => (
                      <TableRow
                        key={row.id}
                        className="cursor-pointer"
                        onClick={() => router.push(`/sales-team/manager/${row.id}`)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>{getInitials(row.name)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{row.name}</p>
                              <p className="text-xs text-muted-foreground">{row.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{row.team}</TableCell>
                        <TableCell>{row.memberCount}</TableCell>
                        <TableCell>{formatCurrency(row.totalSales)}</TableCell>
                        <TableCell>{formatCurrency(row.targetAmount)}</TableCell>
                        <TableCell>{row.targetAchievement}%</TableCell>
                        <TableCell>{formatCurrency(row.totalPipeline)}</TableCell>
                        <TableCell>
                          {row.activeDeals} / {row.wonDeals}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={row.status} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold">Salespeople</h2>
        {canCreateUsers ? (
          <Button variant="accent" onClick={() => setSalespersonFormOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Salesperson
          </Button>
        ) : null}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={UsersRound}
          title="No salespeople found"
          description="Try a different search or filter."
        />
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {filtered.map((row) => (
              <Link key={row.id} href={`/sales-team/${row.id}`}>
                <Card className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{row.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {row.managerName} · {row.team}
                      </p>
                    </div>
                    <StatusBadge status={row.status} />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <p>Sales: {formatCurrency(row.sales)}</p>
                    <p>Target: {formatCurrency(row.target)}</p>
                    <p>Achievement: {row.achievement}%</p>
                    <p>Pipeline: {formatCurrency(row.pipeline)}</p>
                    <p>Active deals: {row.activeCount}</p>
                    <PerformanceBadge status={row.performance} />
                  </div>
                </Card>
              </Link>
            ))}
          </div>

          <Card className="hidden overflow-hidden md:block">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Salesperson</TableHead>
                    <TableHead>Manager / Team</TableHead>
                    <TableHead>Sales</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Achievement</TableHead>
                    <TableHead>Pipeline</TableHead>
                    <TableHead>Active deals</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((row) => (
                    <TableRow
                      key={row.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/sales-team/${row.id}`)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>{getInitials(row.name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{row.name}</p>
                            <p className="text-xs text-muted-foreground">{row.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p>{row.managerName}</p>
                        <p className="text-xs text-muted-foreground">{row.team}</p>
                      </TableCell>
                      <TableCell>{formatCurrency(row.sales)}</TableCell>
                      <TableCell>{formatCurrency(row.target)}</TableCell>
                      <TableCell>{row.achievement}%</TableCell>
                      <TableCell>{formatCurrency(row.pipeline)}</TableCell>
                      <TableCell>{row.activeCount}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <StatusBadge status={row.status} />
                          <PerformanceBadge status={row.performance as PerformanceStatus} />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </>
      )}

      <SalespersonFormDialog open={salespersonFormOpen} onOpenChange={setSalespersonFormOpen} />
      <ManagerFormDialog open={managerFormOpen} onOpenChange={setManagerFormOpen} />
    </div>
  );
}
