"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { KpiCard } from "@/components/ui/kpi-card";
import { SearchBar } from "@/components/ui/search-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { PerformanceBadge } from "@/components/sales-team/performance-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
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
import { formatCurrency, formatDate, getInitials } from "@/lib/utils";
import { useCRMStore, useCurrentUser, usePermissions } from "@/store/CRMStoreProvider";
import { Plus, UsersRound } from "lucide-react";
import type { PerformanceStatus } from "@/store/salesTeam";
import { Button } from "@/components/ui/button";
import { AddSalespersonRequestDialog } from "@/components/team/add-salesperson-request-dialog";
import { RequestStatusBadge, RequestTypeBadge } from "@/components/team/team-request-badges";
import { teamRequestService } from "@/services";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export default function MyTeamPage() {
  const router = useRouter();
  const user = useCurrentUser();
  const { canRequestTeamMembers } = usePermissions();
  const { getMyTeamOverview, getMyTeamRows, getTeamRequestsForManager, getPendingTeamRequest } =
    useCRMStore();
  const overview = getMyTeamOverview();
  const rows = getMyTeamRows();
  const teamRequests = getTeamRequestsForManager();
  const pendingRequests = teamRequests.filter((item) => item.status === "pending");
  const historyRequests = teamRequests.filter((item) => item.status !== "pending");

  const [search, setSearch] = useState("");
  const [performance, setPerformance] = useState("all");
  const [requestOpen, setRequestOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<{ id: string; name: string } | undefined>();

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rows.filter((row) => {
      const matchesSearch =
        row.name.toLowerCase().includes(q) || row.email.toLowerCase().includes(q);
      const matchesPerf = performance === "all" || row.performance === performance;
      return matchesSearch && matchesPerf;
    });
  }, [rows, search, performance]);

  const ranked = useMemo(
    () => [...rows].sort((a, b) => b.achievement - a.achievement),
    [rows]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Team"
        description="Monitor your team's sales performance and activity."
        actions={
          canRequestTeamMembers ? (
            <Button variant="accent" onClick={() => setRequestOpen(true)}>
              <Plus className="h-4 w-4" />
              Add Salesperson
            </Button>
          ) : undefined
        }
      />

      <p className="text-sm text-muted-foreground">
        {user?.team ?? "Assigned team"} · {overview.totalSalespeople} salespeople
      </p>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
        <KpiCard label="Team Members" value={String(overview.totalSalespeople)} />
        <KpiCard label="Team Sales" value={formatCurrency(overview.totalSales)} featured />
        <KpiCard label="Team Target" value={formatCurrency(overview.targetAmount)} />
        <KpiCard
          label="Target Achievement"
          value={`${overview.targetAchievement}%`}
          progress={Math.min(100, overview.targetAchievement)}
        />
        <KpiCard label="Team Pipeline" value={formatCurrency(overview.totalPipeline)} />
        <KpiCard label="Won Deals" value={String(overview.wonDeals)} />
        <KpiCard label="Active Deals" value={String(overview.activeDeals)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Team Requests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {pendingRequests.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pending requests.</p>
          ) : (
            pendingRequests.map((request) => (
              <div
                key={request.id}
                className="flex flex-col gap-3 rounded-xl border border-border p-4 sm:flex-row sm:items-start sm:justify-between"
              >
                <div>
                  <div className="mb-2">
                    <RequestTypeBadge type={request.type} />
                  </div>
                  <p className="font-medium">{request.salespersonName}</p>
                  <p className="text-sm text-muted-foreground">{request.salespersonEmail}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Requested {formatDate(request.createdAt)}
                  </p>
                  <p className="mt-1 text-sm">Pending Admin Approval</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <RequestStatusBadge status={request.status} />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        await teamRequestService.cancelTeamRequest(request.id);
                        toast.success("Request cancelled");
                      } catch (error) {
                        toast.error(error instanceof Error ? error.message : "Unable to cancel request");
                      }
                    }}
                  >
                    Cancel request
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {historyRequests.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Request history</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {historyRequests.map((request) => (
              <div key={request.id} className="rounded-xl border border-border p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <RequestTypeBadge type={request.type} />
                    <p className="mt-2 font-medium">{request.salespersonName}</p>
                    <p className="text-sm text-muted-foreground">{request.salespersonEmail}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Requested {formatDate(request.createdAt)}
                      {request.reviewedAt ? ` · Reviewed ${formatDate(request.reviewedAt)}` : ""}
                    </p>
                  </div>
                  <RequestStatusBadge status={request.status} />
                </div>
                {request.rejectionReason ? (
                  <p className="mt-2 text-sm text-muted-foreground">{request.rejectionReason}</p>
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Team Performance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {ranked.length === 0 ? (
            <p className="text-sm text-muted-foreground">No team members assigned.</p>
          ) : (
            ranked.map((member) => (
              <div key={member.id}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium">{member.name}</span>
                  <span className="text-muted-foreground">{member.achievement}%</span>
                </div>
                <Progress value={Math.min(100, member.achievement)} className="h-2" />
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatCurrency(member.pipeline)} pipeline · {member.followUpCount} follow-ups
                  {member.overdueCount > 0 ? ` · ${member.overdueCount} overdue` : ""}
                  {member.achievement < 100 ? " · below target" : " · on or above target"}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 lg:flex-row">
        <SearchBar
          placeholder="Search salesperson"
          value={search}
          onChange={setSearch}
          className="lg:max-w-sm"
        />
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

      {filtered.length === 0 ? (
        <EmptyState
          icon={UsersRound}
          title="No salespeople found"
          description="No members match this search in your team."
        />
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {filtered.map((row) => {
              const removalPending = Boolean(getPendingTeamRequest(row.id, "remove"));
              return (
                <Card key={row.id} className="p-4">
                  <Link href={`/my-team/${row.id}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{row.name}</p>
                        <p className="text-sm text-muted-foreground">{row.email}</p>
                      </div>
                      <PerformanceBadge status={row.performance} />
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                      <p>Sales: {formatCurrency(row.sales)}</p>
                      <p>Target: {formatCurrency(row.target)}</p>
                      <p>Achievement: {row.achievement}%</p>
                      <p>Pipeline: {formatCurrency(row.pipeline)}</p>
                      <p>Won: {row.wonCount}</p>
                      <p>Active: {row.activeCount}</p>
                      <p>Follow-ups: {row.followUpCount}</p>
                      <StatusBadge status={row.status} />
                    </div>
                  </Link>
                  <div className="mt-3">
                    {removalPending ? (
                      <p className="text-sm font-medium text-muted-foreground">Removal Pending</p>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setRemoveTarget({ id: row.id, name: row.name })}
                      >
                        Request Removal
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>

          <Card className="hidden overflow-hidden md:block">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Salesperson</TableHead>
                    <TableHead>Sales</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Achievement %</TableHead>
                    <TableHead>Pipeline</TableHead>
                    <TableHead>Won Deals</TableHead>
                    <TableHead>Active Deals</TableHead>
                    <TableHead>Follow-ups</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((row) => {
                    const removalPending = Boolean(getPendingTeamRequest(row.id, "remove"));
                    return (
                    <TableRow
                      key={row.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/my-team/${row.id}`)}
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
                      <TableCell>{formatCurrency(row.sales)}</TableCell>
                      <TableCell>{formatCurrency(row.target)}</TableCell>
                      <TableCell>{row.achievement}%</TableCell>
                      <TableCell>{formatCurrency(row.pipeline)}</TableCell>
                      <TableCell>{row.wonCount}</TableCell>
                      <TableCell>{row.activeCount}</TableCell>
                      <TableCell>
                        {row.followUpCount}
                        {row.overdueCount > 0 ? ` · ${row.overdueCount} overdue` : ""}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <StatusBadge status={row.status} />
                          <PerformanceBadge status={row.performance as PerformanceStatus} />
                        </div>
                      </TableCell>
                      <TableCell>
                        {removalPending ? (
                          <span className="text-sm text-muted-foreground">Removal Pending</span>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(event) => {
                              event.stopPropagation();
                              setRemoveTarget({ id: row.id, name: row.name });
                            }}
                          >
                            Request Removal
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>
        </>
      )}

      <AddSalespersonRequestDialog open={requestOpen} onOpenChange={setRequestOpen} />
      <ConfirmDialog
        open={Boolean(removeTarget)}
        onOpenChange={(open) => {
          if (!open) setRemoveTarget(undefined);
        }}
        title={`Request removal of ${removeTarget?.name ?? "this salesperson"}?`}
        description={`An Admin must approve this request before ${removeTarget?.name ?? "this salesperson"} is removed from your team. They will stay on your team until then.`}
        confirmLabel="Send Removal Request"
        onConfirm={() => {
          if (!removeTarget) return;
          void (async () => {
            try {
              await teamRequestService.createTeamRequest(removeTarget.id, "remove");
              toast.success("Team request sent to Admin.");
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Unable to send removal request");
            }
          })();
        }}
      />
    </div>
  );
}
