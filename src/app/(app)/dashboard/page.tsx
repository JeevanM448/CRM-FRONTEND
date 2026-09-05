"use client";

import Link from "next/link";
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
import { AlertTriangle, ArrowRight, Mail, Plus, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/ui/kpi-card";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/ui/status-badge";
import { ActivityTimeline } from "@/components/ui/activity-timeline";
import { formatCurrency } from "@/lib/utils";
import { useCRMStore, usePermissions } from "@/store/CRMStoreProvider";
import { ComposeEmailDialog } from "@/components/email/compose-email-dialog";
import { DealFormDialog } from "@/components/deals/deal-form-dialog";
import { CustomerFormDialog } from "@/components/customers/customer-form-dialog";
import { SalespersonDashboard } from "@/components/dashboard/salesperson-dashboard";
import { ManagerDashboard } from "@/components/dashboard/manager-dashboard";
import { useState } from "react";

export default function DashboardPage() {
  const {
    getDashboardMetrics,
    getPipeline,
    getAttentionDealsList,
    getActivities,
    getRevenueChartData,
    getTeamPerformance,
    getCurrentUser,
  } = useCRMStore();
  const { canAccessTeamPerformance } = usePermissions();
  const user = getCurrentUser();
  const [showDeal, setShowDeal] = useState(false);
  const [showCustomer, setShowCustomer] = useState(false);
  const [showEmail, setShowEmail] = useState(false);

  if (user?.role === "salesperson") {
    return <SalespersonDashboard />;
  }

  if (user?.role === "sales_manager") {
    return <ManagerDashboard />;
  }

  const metrics = getDashboardMetrics();
  const attentionDeals = getAttentionDealsList();
  const activities = getActivities().slice(0, 5);
  const pipeline = getPipeline();
  const revenueChart = getRevenueChartData();
  const teamPerformance = getTeamPerformance();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Good morning, {user?.name.split(" ")[0]}
          </h1>
          <p className="mt-1 text-muted-foreground">
            Here&apos;s what&apos;s happening with your sales today.
          </p>
        </div>
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
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          featured
          label="Sales Update"
          value={`${metrics.achievedPercent}% of target`}
          subValue={`${formatCurrency(metrics.totalSales)} closed`}
          changeType="positive"
        />
        <KpiCard
          label="Total Sales"
          value={formatCurrency(metrics.totalSales)}
          subValue="Won deals revenue"
        />
        <KpiCard
          label="Sales Target"
          value={formatCurrency(metrics.targetAmount)}
          progress={metrics.achievedPercent}
        />
        <KpiCard
          label="Open Deals"
          value={String(metrics.openDealsCount)}
          subValue={`${formatCurrency(metrics.pipelineValue)} pipeline`}
        />
        <KpiCard
          label="Pending POs"
          value={String(metrics.pendingPOCount)}
          subValue={`${formatCurrency(metrics.pendingPOValue)} value`}
          className="sm:col-span-2 xl:col-span-1"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Sales Target Progress</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {formatCurrency(metrics.totalSales)} / {formatCurrency(metrics.targetAmount)}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{metrics.achievedPercent}% achieved</p>
            <Progress value={metrics.achievedPercent} className="mt-6 h-3" indicatorClassName="bg-brand-lime" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
          <CardContent><ActivityTimeline activities={activities} /></CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Sales Pipeline</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/pipeline">View board <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={pipeline} barGap={8}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v / 100000}L`} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Bar dataKey="value" fill="#0B1914" radius={[6, 6, 0, 0]} name="Deal Value" />
                <Bar dataKey="count" fill="#B3E64F" radius={[6, 6, 0, 0]} name="Deal Count" />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Deals Requiring Attention</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {attentionDeals.length === 0 ? (
              <p className="text-sm text-muted-foreground">No deals require attention right now.</p>
            ) : (
              attentionDeals.map((deal) => (
                <Link
                  key={deal.id}
                  href={`/deals/${deal.id}`}
                  className="flex items-center justify-between rounded-xl border border-border p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
                      <AlertTriangle className="h-4 w-4 text-warning" />
                    </div>
                    <div>
                      <p className="font-medium">{deal.customerName}</p>
                      <p className="text-sm text-muted-foreground">{deal.attentionReason}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(deal.value)}</p>
                    {deal.priority && <StatusBadge status={deal.priority} type="priority" />}
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Revenue Trend</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={revenueChart}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v / 100000}L`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Line type="monotone" dataKey="revenue" stroke="#0B1914" strokeWidth={2} name="Revenue" />
                <Line type="monotone" dataKey="target" stroke="#B3E64F" strokeWidth={2} strokeDasharray="5 5" name="Target" />
                <Legend />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {canAccessTeamPerformance && (
          <Card>
            <CardHeader><CardTitle>Team Performance</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {teamPerformance.map((member) => {
                const pct = Math.round((member.revenue / member.target) * 100);
                return (
                  <div key={member.name}>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="font-medium">{member.name}</span>
                      <span className="text-muted-foreground">
                        {formatCurrency(member.revenue)} / {formatCurrency(member.target)}
                      </span>
                    </div>
                    <Progress value={pct} className="h-2" />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}
      </div>

      <DealFormDialog open={showDeal} onOpenChange={setShowDeal} />
      <CustomerFormDialog open={showCustomer} onOpenChange={setShowCustomer} />
      <ComposeEmailDialog open={showEmail} onOpenChange={setShowEmail} />
    </div>
  );
}
