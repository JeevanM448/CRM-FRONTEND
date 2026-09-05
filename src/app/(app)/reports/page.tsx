"use client";

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
import { PageHeader } from "@/components/ui/page-header";
import { KpiCard } from "@/components/ui/kpi-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { useCRMStore } from "@/store/CRMStoreProvider";

export default function ReportsPage() {
  const {
    getDashboardMetrics,
    getPipeline,
    getRevenueChartData,
    getTeamPerformance,
    getVisibleUsers,
    getDeals,
    getCurrentUser,
    getFollowUps,
    getFollowUpCounts,
  } = useCRMStore();

  const user = getCurrentUser();
  const [period, setPeriod] = useState("6m");
  const [salesperson, setSalesperson] = useState("all");

  const metrics = getDashboardMetrics();
  const pipeline = getPipeline();
  const revenueChart = getRevenueChartData();
  const teamPerformance = getTeamPerformance();
  const users = getVisibleUsers().filter((u) => u.role === "salesperson");
  const deals = getDeals();
  const followUps = getFollowUps();
  const followUpCounts = getFollowUpCounts();
  const isSalesperson = user?.role === "salesperson";

  const isAdmin = user?.role === "admin";
  const isManager = user?.role === "sales_manager";
  const title = isAdmin ? "Reports" : isManager ? "Team Reports" : "My Reports";
  const description = isAdmin
    ? "Analyze organization performance, pipeline health, and team metrics."
    : isManager
      ? "Analyze your team's sales, targets, pipeline, and follow-up performance."
      : "Analyze your sales, targets, pipeline, and follow-up performance.";

  const filteredTeam = salesperson === "all"
    ? teamPerformance
    : teamPerformance.filter((m) => m.name === users.find((u) => u.id === salesperson)?.name);

  const dealsByStage = useMemo(() => {
    const stages = ["new", "qualified", "quotation", "negotiation", "won", "lost"] as const;
    return stages.map((stage) => ({
      stage,
      count: deals.filter((d) => d.stage === stage).length,
      value: deals.filter((d) => d.stage === stage).reduce((s, d) => s + d.value, 0),
    }));
  }, [deals]);

  const achievementData = filteredTeam.map((m) => ({
    name: m.name.split(" ")[0],
    achievement: m.target > 0 ? Math.round((m.revenue / m.target) * 100) : 0,
  }));

  const wonVsLost = [
    { name: "Won", value: metrics.wonCount },
    { name: "Lost", value: metrics.lostCount },
    { name: "Active", value: metrics.openDealsCount },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={description}
        actions={
          <div className="flex flex-wrap gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1m">Last Month</SelectItem>
                <SelectItem value="3m">Last 3 Months</SelectItem>
                <SelectItem value="6m">Last 6 Months</SelectItem>
                <SelectItem value="1y">Last Year</SelectItem>
              </SelectContent>
            </Select>
            {!isSalesperson ? (
              <Select value={salesperson} onValueChange={setSalesperson}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="Salesperson" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isManager ? "All team members" : "All Salespeople"}</SelectItem>
                  {users.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                </SelectContent>
              </Select>
            ) : null}
          </div>
        }
      />

      {isSalesperson ? (
        <h2 className="text-lg font-semibold">Personal Sales Summary</h2>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label={isSalesperson ? "Total Sales" : isManager ? "Team Sales" : "Revenue"} value={formatCurrency(metrics.totalSales)} />
        <KpiCard
          label={isSalesperson || isManager ? (isSalesperson ? "Target" : "Team Target") : "Target"}
          value={formatCurrency(metrics.targetAmount)}
          progress={metrics.achievedPercent}
        />
        <KpiCard
          label={isSalesperson ? "Achievement %" : isManager ? "Team Achievement" : "Win Rate"}
          value={isSalesperson || isManager ? `${metrics.achievedPercent}%` : `${metrics.winRate}%`}
        />
        <KpiCard
          label={isSalesperson ? "Pipeline Value" : isManager ? "Team Pipeline" : "Avg Deal Value"}
          value={isSalesperson || isManager ? formatCurrency(metrics.pipelineValue) : formatCurrency(metrics.avgDealValue)}
        />
        <KpiCard label="Win Rate" value={`${metrics.winRate}%`} />
        <KpiCard label="Won Deals" value={String(metrics.wonCount)} />
        <KpiCard label="Lost Deals" value={String(metrics.lostCount)} />
        <KpiCard
          label="Follow-up Completion"
          value={`${metrics.followUpCompletion}%`}
          subValue={`${followUps.filter((f) => f.status !== "completed").length} pending`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>{isSalesperson ? "Sales Trend" : "Revenue Trend"}</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={revenueChart}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v / 100000}L`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Line type="monotone" dataKey="revenue" stroke="#0B1914" strokeWidth={2} name={isSalesperson ? "Sales" : "Revenue"} />
                <Line type="monotone" dataKey="target" stroke="#B3E64F" strokeWidth={2} strokeDasharray="5 5" name="Target" />
                <Legend />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {!isSalesperson ? (
          <Card>
            <CardHeader><CardTitle>{isManager ? "Team deal performance" : "Sales by Salesperson"}</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={filteredTeam} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                  <XAxis type="number" tickFormatter={(v) => `₹${v / 100000}L`} />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Bar dataKey="revenue" fill="#0B1914" radius={[0, 4, 4, 0]} name="Revenue" />
                  <Bar dataKey="target" fill="#B3E64F" radius={[0, 4, 4, 0]} name="Target" />
                  <Legend />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader><CardTitle>Won vs Lost</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={wonVsLost}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#0B1914" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle>{isSalesperson ? "Deal Performance" : "Pipeline Value by Stage"}</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={pipeline}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v) => `₹${v / 100000}L`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Bar dataKey="value" fill="#0B1914" radius={[6, 6, 0, 0]} name="Pipeline Value" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Deals by Stage</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={dealsByStage}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="stage" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#B3E64F" radius={[6, 6, 0, 0]} name="Deal Count" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {isSalesperson ? (
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>Follow-up Performance</CardTitle></CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <KpiCard label="Completed" value={String(followUpCounts.completed)} />
                <KpiCard label="Pending" value={String(followUpCounts.pending)} />
                <KpiCard
                  label="Overdue"
                  value={String(followUpCounts.overdue)}
                  changeType={followUpCounts.overdue > 0 ? "negative" : "positive"}
                />
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="lg:col-span-2">
              <CardHeader><CardTitle>Target Achievement</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={achievementData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                    <Tooltip formatter={(v: number) => `${v}%`} />
                    <Bar dataKey="achievement" fill="#B3E64F" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>{isManager ? "Individual team performance" : "Individual performance"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[...filteredTeam]
                  .sort((a, b) => b.revenue / b.target - a.revenue / a.target)
                  .map((member) => {
                    const pct = member.target > 0 ? Math.round((member.revenue / member.target) * 100) : 0;
                    return (
                      <div key={member.name} className="flex items-center justify-between text-sm">
                        <span className="font-medium">{member.name}</span>
                        <span className="text-muted-foreground">{pct}%</span>
                      </div>
                    );
                  })}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
