"use client";

import { useMemo, useState } from "react";
import { ShieldAlert, Target } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { KpiCard } from "@/components/ui/kpi-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { StatusBadge } from "@/components/ui/status-badge";
import { useCRMStore, usePermissions } from "@/store/CRMStoreProvider";
import { buildPeriodValue, formatPeriodLabel } from "@/store/targets";
import { formatCurrency } from "@/lib/utils";
import type { SalespersonTargetRow } from "@/store/targets";
import type { ManagerTeamTargetSummary } from "@/store/teamTargets";

function ManagerTeamTargetsView({
  summary,
  teamRows,
  defaultPeriod,
}: {
  summary: ManagerTeamTargetSummary;
  teamRows: SalespersonTargetRow[];
  defaultPeriod: string;
}) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Team Targets"
        description="View sales targets and achievement for your team members."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard label="Team Target" value={formatCurrency(summary.organizationTarget)} featured />
        <KpiCard label="Achieved Sales" value={formatCurrency(summary.achievedSales)} />
        <KpiCard label="Remaining" value={formatCurrency(summary.remaining)} />
        <KpiCard label="Achievement %" value={`${summary.achievementPercent}%`} />
        <KpiCard label="Team Members" value={String(summary.teamMemberCount)} />
      </div>
      <Card>
        <CardContent className="flex items-start gap-3 p-4 text-sm text-muted-foreground">
          <Target className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Current period: <strong>{defaultPeriod}</strong>. Achievement is based on won deal values.
            Target management is restricted to administrators.
          </p>
        </CardContent>
      </Card>
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Salesperson</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Achieved</TableHead>
                <TableHead>Remaining</TableHead>
                <TableHead>Achievement</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teamRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No active targets configured for your team.
                  </TableCell>
                </TableRow>
              ) : (
                teamRows.map((row) => (
                  <TableRow key={row.target.id}>
                    <TableCell>{row.user.name}</TableCell>
                    <TableCell>{formatPeriodLabel(row.target.period, row.target.periodType)}</TableCell>
                    <TableCell>{formatCurrency(row.target.targetAmount)}</TableCell>
                    <TableCell>{formatCurrency(row.achieved)}</TableCell>
                    <TableCell>{formatCurrency(row.remaining)}</TableCell>
                    <TableCell>{row.achievementPercent}%</TableCell>
                    <TableCell>
                      <StatusBadge status={row.target.status === "active" ? "active" : "inactive"} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

function SalespersonTargetsView({
  summary,
  rows,
  defaultPeriod,
}: {
  summary: import("@/store/targets").TargetSummary;
  rows: SalespersonTargetRow[];
  defaultPeriod: string;
}) {
  const activeRow = rows.find((row) => row.target.status === "active") ?? rows[0];

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Targets"
        description="View your sales target, achievement, and progress for the current period."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="My Target" value={formatCurrency(summary.organizationTarget)} featured />
        <KpiCard label="Achieved Sales" value={formatCurrency(summary.achievedSales)} />
        <KpiCard label="Remaining" value={formatCurrency(summary.remaining)} />
        <KpiCard label="Achievement %" value={`${summary.achievementPercent}%`} />
      </div>
      <Card>
        <CardContent className="flex items-start gap-3 p-4 text-sm text-muted-foreground">
          <Target className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Current period: <strong>{defaultPeriod}</strong>. Achievement is based on won deal values.
            Target amounts are managed by your administrator.
          </p>
        </CardContent>
      </Card>
      {activeRow ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Current Period Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              {formatCurrency(activeRow.achieved)} of {formatCurrency(activeRow.target.targetAmount)} (
              {activeRow.achievementPercent}%)
            </p>
            <p className="text-muted-foreground">
              {formatPeriodLabel(activeRow.target.period, activeRow.target.periodType)} · Manager:{" "}
              {activeRow.managerName}
            </p>
          </CardContent>
        </Card>
      ) : null}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Achieved</TableHead>
                <TableHead>Remaining</TableHead>
                <TableHead>Achievement</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No targets configured for your account.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.target.id}>
                    <TableCell>{formatPeriodLabel(row.target.period, row.target.periodType)}</TableCell>
                    <TableCell>{formatCurrency(row.target.targetAmount)}</TableCell>
                    <TableCell>{formatCurrency(row.achieved)}</TableCell>
                    <TableCell>{formatCurrency(row.remaining)}</TableCell>
                    <TableCell>{row.achievementPercent}%</TableCell>
                    <TableCell>
                      <StatusBadge status={row.target.status === "active" ? "active" : "inactive"} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

export default function TargetsPage() {
  const { canManageTargets, canViewTargets, role } = usePermissions();
  const {
    getManagerTeamTargetRows,
    getManagerTeamTargetSummary,
    getSalespersonOwnTargetRows,
    getSalespersonOwnTargetSummary,
    getDefaultPeriod,
  } = useCRMStore();

  const isManager = role === "sales_manager";
  const isSalesperson = role === "salesperson";

  if (!canManageTargets && !canViewTargets) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="Access restricted"
        description="You do not have permission to view targets."
      />
    );
  }

  if (!canManageTargets && isManager) {
    return (
      <ManagerTeamTargetsView
        summary={getManagerTeamTargetSummary()}
        teamRows={getManagerTeamTargetRows()}
        defaultPeriod={getDefaultPeriod()}
      />
    );
  }

  if (!canManageTargets && isSalesperson) {
    return (
      <SalespersonTargetsView
        summary={getSalespersonOwnTargetSummary()}
        rows={getSalespersonOwnTargetRows()}
        defaultPeriod={getDefaultPeriod()}
      />
    );
  }

  if (!canManageTargets) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="Access restricted"
        description="Only administrators with target management access can modify targets."
      />
    );
  }

  return <AdminTargetsContent />;
}

function AdminTargetsContent() {
  const {
    getTargetSummaryView,
    getSalespersonTargets,
    getTeamTargets,
    getTargetHistory,
    createSalesTarget,
    updateSalesTarget,
    archiveSalesTarget,
    getDefaultPeriod,
    getUsers,
  } = useCRMStore();

  const summary = getTargetSummaryView();
  const salespersonTargets = getSalespersonTargets();
  const teamTargets = getTeamTargets();
  const history = getTargetHistory();
  const salespeople = getUsers().filter((user) => user.role === "salesperson" && user.status === "active");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    userId: "",
    periodType: "quarterly" as "monthly" | "quarterly" | "yearly",
    year: 2026,
    month: 9,
    quarter: 3,
    targetAmount: 0,
    reason: "",
  });

  const editingTarget = useMemo(
    () => salespersonTargets.find((row) => row.target.id === editingId),
    [editingId, salespersonTargets]
  );

  function openCreate() {
    setEditingId(undefined);
    setForm({
      userId: "",
      periodType: "quarterly",
      year: 2026,
      month: 9,
      quarter: 3,
      targetAmount: 0,
      reason: "",
    });
    setDialogOpen(true);
  }

  function openEdit(id: string) {
    const row = salespersonTargets.find((item) => item.target.id === id);
    if (!row) return;
    setEditingId(id);
    setForm({
      userId: row.user.id,
      periodType: row.target.periodType,
      year: Number(row.target.period.slice(0, 4)) || 2026,
      month: row.target.periodType === "monthly" ? Number(row.target.period.slice(5, 7)) : 9,
      quarter: row.target.period.includes("Q")
        ? Number(row.target.period.split("Q")[1])
        : 3,
      targetAmount: row.target.targetAmount,
      reason: "",
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    const period = buildPeriodValue(form.periodType, form.year, form.month, form.quarter);
    setSaving(true);
    try {
      if (editingId) {
        updateSalesTarget(editingId, {
          period,
          periodType: form.periodType,
          targetAmount: form.targetAmount,
          reason: form.reason || undefined,
        });
        toast.success("Target updated");
      } else {
        createSalesTarget({
          userId: form.userId,
          period,
          periodType: form.periodType,
          targetType: "salesperson",
          targetAmount: form.targetAmount,
          reason: form.reason || undefined,
        });
        toast.success("Target created");
      }
      setDialogOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save target");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Targets"
        description="Manage organization-wide salesperson and team targets."
        actions={
          <Button variant="accent" onClick={openCreate}>
            Add Target
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard label="Organization Target" value={formatCurrency(summary.organizationTarget)} />
        <KpiCard label="Achieved Sales" value={formatCurrency(summary.achievedSales)} />
        <KpiCard label="Remaining" value={formatCurrency(summary.remaining)} />
        <KpiCard label="Achievement %" value={`${summary.achievementPercent}%`} featured />
        <KpiCard label="Active Targets" value={String(summary.activeTargets)} />
      </div>

      <Card>
        <CardContent className="flex items-start gap-3 p-4 text-sm text-muted-foreground">
          <Target className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Default period from organization settings: <strong>{getDefaultPeriod()}</strong>.
            Team targets are calculated from member targets unless an explicit team target is configured.
          </p>
        </CardContent>
      </Card>

      <Tabs defaultValue="salespeople">
        <TabsList>
          <TabsTrigger value="salespeople">Salesperson Targets</TabsTrigger>
          <TabsTrigger value="teams">Manager / Team Targets</TabsTrigger>
          <TabsTrigger value="history">Target History</TabsTrigger>
        </TabsList>

        <TabsContent value="salespeople" className="space-y-4">
          <div className="space-y-3 md:hidden">
            {salespersonTargets.map((row) => (
              <Card key={row.target.id} className="p-4">
                <div className="space-y-2">
                  <p className="font-medium">{row.user.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatPeriodLabel(row.target.period, row.target.periodType)} · {row.managerName}
                  </p>
                  <p className="text-sm">
                    {formatCurrency(row.achieved)} / {formatCurrency(row.target.targetAmount)} (
                    {row.achievementPercent}%)
                  </p>
                  <div className="flex gap-2">
                    <StatusBadge status={row.target.status === "active" ? "active" : "inactive"} />
                    <Button variant="outline" size="sm" onClick={() => openEdit(row.target.id)}>
                      Edit
                    </Button>
                    {row.target.status === "active" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          archiveSalesTarget(row.target.id);
                          toast.success("Target archived");
                        }}
                      >
                        Archive
                      </Button>
                    ) : null}
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <div className="hidden overflow-x-auto md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Salesperson</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Achieved</TableHead>
                  <TableHead>Remaining</TableHead>
                  <TableHead>Achievement</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salespersonTargets.map((row) => (
                  <TableRow key={row.target.id}>
                    <TableCell>{row.user.name}</TableCell>
                    <TableCell>{formatPeriodLabel(row.target.period, row.target.periodType)}</TableCell>
                    <TableCell>{formatCurrency(row.target.targetAmount)}</TableCell>
                    <TableCell>{formatCurrency(row.achieved)}</TableCell>
                    <TableCell>{formatCurrency(row.remaining)}</TableCell>
                    <TableCell>{row.achievementPercent}%</TableCell>
                    <TableCell>
                      <StatusBadge status={row.target.status === "active" ? "active" : "inactive"} />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEdit(row.target.id)}>
                          Edit
                        </Button>
                        {row.target.status === "active" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              archiveSalesTarget(row.target.id);
                              toast.success("Target archived");
                            }}
                          >
                            Archive
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="teams" className="space-y-3">
          {teamTargets.map((row) => (
            <Card key={row.manager.id} className="p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="font-medium">{row.manager.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {row.team} · {row.memberCount} member{row.memberCount === 1 ? "" : "s"}
                  </p>
                  <p className="text-xs text-muted-foreground">{row.members.join(", ") || "No members"}</p>
                </div>
                <div className="text-sm">
                  <p>{formatCurrency(row.achieved)} / {formatCurrency(row.targetAmount)}</p>
                  <p>{row.achievementPercent}% · Remaining {formatCurrency(row.remaining)}</p>
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="history" className="space-y-3">
          {history.length === 0 ? (
            <EmptyState icon={Target} title="No target history" description="Target amount changes will appear here." />
          ) : (
            history.map((entry) => (
              <Card key={entry.id} className="p-4">
                <p className="font-medium">
                  {formatCurrency(entry.previousAmount)} → {formatCurrency(entry.newAmount)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Target {entry.targetId} · {new Date(entry.changedAt).toLocaleString()}
                </p>
                {entry.reason ? <p className="text-sm">{entry.reason}</p> : null}
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTarget ? "Edit Target" : "Add Target"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!editingTarget ? (
              <div className="space-y-2">
                <Label>Salesperson</Label>
                <Select value={form.userId} onValueChange={(value) => setForm({ ...form, userId: value })}>
                  <SelectTrigger><SelectValue placeholder="Select salesperson" /></SelectTrigger>
                  <SelectContent>
                    {salespeople.map((user) => (
                      <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Period Type</Label>
                <Select
                  value={form.periodType}
                  onValueChange={(value) =>
                    setForm({ ...form, periodType: value as typeof form.periodType })
                  }
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Year</Label>
                <Input
                  type="number"
                  value={form.year}
                  onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Target Amount</Label>
              <Input
                type="number"
                min={0}
                value={form.targetAmount}
                onChange={(e) => setForm({ ...form, targetAmount: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label>Reason (optional)</Label>
              <Input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <SubmitButton loading={saving} loadingText="Saving..." onClick={handleSave}>
              Save Target
            </SubmitButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
