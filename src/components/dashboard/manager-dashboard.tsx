"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Briefcase,
  Kanban,
  Mail,
  Plus,
  Target,
  UserPlus,
  UsersRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/ui/kpi-card";
import { PageHeader } from "@/components/ui/page-header";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/ui/empty-state";
import { ActivityTimeline } from "@/components/ui/activity-timeline";
import { PerformanceBadge } from "@/components/sales-team/performance-badge";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { useCRMStore } from "@/store/CRMStoreProvider";
import { ComposeEmailDialog } from "@/components/email/compose-email-dialog";
import { DealFormDialog } from "@/components/deals/deal-form-dialog";
import { CustomerFormDialog } from "@/components/customers/customer-form-dialog";

const QUICK_ACTIONS = [
  { label: "My Team", href: "/my-team", icon: UsersRound },
  { label: "Team Deals", href: "/deals", icon: Briefcase },
  { label: "Team Customers", href: "/customers", icon: UserPlus },
  { label: "Team Pipeline", href: "/pipeline", icon: Kanban },
  { label: "Team Reports", href: "/reports", icon: BarChart3 },
  { label: "Follow-ups", href: "/follow-ups", icon: Target },
] as const;

function memberWinRate(wonCount: number, lostCount: number) {
  const closed = wonCount + lostCount;
  return closed > 0 ? Math.round((wonCount / closed) * 100) : 0;
}

export function ManagerDashboard() {
  const { getManagerDashboardData } = useCRMStore();
  const data = useMemo(() => getManagerDashboardData(), [getManagerDashboardData]);

  const [showDeal, setShowDeal] = useState(false);
  const [showCustomer, setShowCustomer] = useState(false);
  const [showEmail, setShowEmail] = useState(false);

  if (!data) {
    return (
      <EmptyState
        icon={UsersRound}
        title="Manager dashboard unavailable"
        description="Sign in as a sales manager to view your team dashboard."
      />
    );
  }

  const { manager, team, kpis, pipelineByStage, salesTrend, recentActivity, attentionItems, overview, pendingTeamRequests } = data;
  const hasPipelineChart = pipelineByStage.some((stage) => stage.count > 0 || stage.value > 0);
  const hasSalesTrend = salesTrend.some((point) => point.revenue > 0 || point.target > 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manager Dashboard"
        description="Monitor your team's sales performance, pipeline, targets and activities."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="accent" onClick={() => setShowDeal(true)}>
              <Plus className="h-4 w-4" />
              New Deal
            </Button>
            <Button variant="outline" onClick={() => setShowCustomer(true)}>
              <UserPlus className="h-4 w-4" />
              Customer
            </Button>
            <Button variant="outline" onClick={() => setShowEmail(true)}>
              <Mail className="h-4 w-4" />
              Compose Email
            </Button>
          </div>
        }
      />

      <p className="text-sm text-muted-foreground">
        {manager.team ?? "Assigned team"} · {overview.totalSalespeople} team member
        {overview.totalSalespeople === 1 ? "" : "s"}
      </p>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          featured
          label="Team Sales"
          value={formatCurrency(kpis.teamSales)}
          subValue="Won deals revenue"
        />
        <KpiCard
          label="Pipeline Value"
          value={formatCurrency(kpis.pipelineValue)}
          subValue={`${kpis.activeDeals} active deal${kpis.activeDeals === 1 ? "" : "s"}`}
        />
        <KpiCard
          label="Win Rate"
          value={`${kpis.winRate}%`}
          subValue={
            kpis.closedDeals > 0
              ? `${kpis.wonDeals} won / ${kpis.closedDeals} closed`
              : "No closed deals yet"
          }
        />
        <KpiCard
          label="Target Achievement"
          value={`${kpis.targetAchievement}%`}
          subValue={
            kpis.targetAmount > 0
              ? `${formatCurrency(kpis.teamSales)} of ${formatCurrency(kpis.targetAmount)}`
              : "No team target set"
          }
          progress={Math.min(100, kpis.targetAchievement)}
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {QUICK_ACTIONS.map((action) => (
              <Button key={action.href} variant="outline" className="justify-start" asChild>
                <Link href={action.href}>
                  <action.icon className="h-4 w-4" />
                  {action.label}
                </Link>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {team.length === 0 ? (
        <EmptyState
          icon={UsersRound}
          title="No team members assigned"
          description="Your team dashboard will populate once salespeople are assigned to you."
          actionLabel="View My Team"
          onAction={() => {
            window.location.href = "/my-team";
          }}
        />
      ) : (
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Team Performance</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/my-team">
                View team <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Salesperson</TableHead>
                  <TableHead className="hidden md:table-cell">Sales</TableHead>
                  <TableHead className="hidden lg:table-cell">Target</TableHead>
                  <TableHead>Achievement</TableHead>
                  <TableHead className="hidden sm:table-cell">Pipeline</TableHead>
                  <TableHead className="hidden lg:table-cell">Won</TableHead>
                  <TableHead className="hidden xl:table-cell">Win Rate</TableHead>
                  <TableHead className="hidden md:table-cell">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {team.map((member) => {
                  const winRate = memberWinRate(member.wonCount, member.lostCount);
                  return (
                    <TableRow key={member.id}>
                      <TableCell>
                        <Link href={`/my-team/${member.id}`} className="font-medium hover:underline">
                          {member.name}
                        </Link>
                        <p className="text-xs text-muted-foreground">{member.email}</p>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{formatCurrency(member.sales)}</TableCell>
                      <TableCell className="hidden lg:table-cell">{formatCurrency(member.target)}</TableCell>
                      <TableCell>
                        <div className="min-w-[7rem] space-y-1">
                          <span className="text-sm font-medium">{member.achievement}%</span>
                          <Progress value={Math.min(100, member.achievement)} className="h-1.5" />
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">{formatCurrency(member.pipeline)}</TableCell>
                      <TableCell className="hidden lg:table-cell">{member.wonCount}</TableCell>
                      <TableCell className="hidden xl:table-cell">
                        {member.wonCount + member.lostCount > 0 ? `${winRate}%` : "—"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <PerformanceBadge status={member.performance} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sales Performance Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            {hasSalesTrend ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={salesTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `₹${v / 100000}L`}
                  />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Line type="monotone" dataKey="revenue" stroke="#0B1914" strokeWidth={2} name="Team Sales" />
                  <Line
                    type="monotone"
                    dataKey="target"
                    stroke="#B3E64F"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Target Pace"
                  />
                  <Legend />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-12 text-center text-sm text-muted-foreground">
                No sales trend data available for your team yet.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Pipeline by Stage</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/pipeline">
                View board <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {hasPipelineChart ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={pipelineByStage} barGap={8}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `₹${v / 100000}L`}
                  />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Bar dataKey="value" fill="#0B1914" radius={[6, 6, 0, 0]} name="Value" />
                  <Bar dataKey="count" fill="#B3E64F" radius={[6, 6, 0, 0]} name="Count" />
                  <Legend />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-12 text-center text-sm text-muted-foreground">
                No active pipeline for your team yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Target vs Achievement</CardTitle>
          </CardHeader>
          <CardContent>
            {kpis.targetAmount > 0 ? (
              <>
                <p className="text-3xl font-bold">
                  {formatCurrency(kpis.teamSales)} / {formatCurrency(kpis.targetAmount)}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{kpis.targetAchievement}% achieved</p>
                <Progress value={Math.min(100, kpis.targetAchievement)} className="mt-6 h-3" indicatorClassName="bg-brand-lime" />
                <div className="mt-6 h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: "Achieved", value: kpis.teamSales },
                        { name: "Remaining", value: overview.remaining },
                        { name: "Pipeline", value: kpis.pipelineValue },
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v / 100000}L`} />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Bar dataKey="value" fill="#B3E64F" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </>
            ) : (
              <p className="py-8 text-sm text-muted-foreground">No team targets configured yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Team Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length > 0 ? (
              <ActivityTimeline activities={recentActivity} />
            ) : (
              <p className="text-sm text-muted-foreground">No recent team activity.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Attention Items</CardTitle>
          {pendingTeamRequests > 0 && (
            <Button variant="outline" size="sm" asChild>
              <Link href="/my-team">{pendingTeamRequests} pending request{pendingTeamRequests === 1 ? "" : "s"}</Link>
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {attentionItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">No items need attention right now.</p>
          ) : (
            attentionItems.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="flex items-center justify-between gap-3 rounded-xl border border-border p-4 transition-colors hover:bg-muted/50"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
                {item.priority && <StatusBadge status={item.priority} type="priority" />}
              </Link>
            ))
          )}
        </CardContent>
      </Card>

      <DealFormDialog open={showDeal} onOpenChange={setShowDeal} />
      <CustomerFormDialog open={showCustomer} onOpenChange={setShowCustomer} />
      <ComposeEmailDialog open={showEmail} onOpenChange={setShowEmail} />
    </div>
  );
}
