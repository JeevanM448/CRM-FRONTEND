"use client";

import Link from "next/link";
import { useState } from "react";
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
import { ArrowRight, Mail, Plus, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/ui/kpi-card";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/ui/status-badge";
import { ActivityTimeline } from "@/components/ui/activity-timeline";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useCRMStore } from "@/store/CRMStoreProvider";
import { ComposeEmailDialog } from "@/components/email/compose-email-dialog";
import { DealFormDialog } from "@/components/deals/deal-form-dialog";
import { CustomerFormDialog } from "@/components/customers/customer-form-dialog";

export function SalespersonDashboard() {
  const {
    getDashboardMetrics,
    getPipeline,
    getActivities,
    getRevenueChartData,
    getCurrentUser,
    getFollowUpCounts,
    getDeals,
    getCustomers,
    getFollowUps,
    getPurchaseOrders,
  } = useCRMStore();

  const user = getCurrentUser();
  const metrics = getDashboardMetrics();
  const followUpCounts = getFollowUpCounts();
  const deals = getDeals();
  const customers = getCustomers();
  const followUps = getFollowUps();
  const purchaseOrders = getPurchaseOrders();
  const activities = getActivities().slice(0, 8);
  const pipeline = getPipeline();
  const revenueChart = getRevenueChartData();

  const outcomeData = [
    { name: "Won", value: metrics.wonCount },
    { name: "Lost", value: metrics.lostCount },
    { name: "Active", value: metrics.openDealsCount },
  ];

  const salesVsTarget = [
    { name: "Sales", value: metrics.totalSales },
    { name: "Target", value: metrics.targetAmount },
    { name: "Pipeline", value: metrics.pipelineValue },
  ];

  const [showDeal, setShowDeal] = useState(false);
  const [showCustomer, setShowCustomer] = useState(false);
  const [showEmail, setShowEmail] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Dashboard</h1>
          <p className="mt-1 text-muted-foreground">
            Track your sales performance, deals and activities.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{user?.name}</p>
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
        <KpiCard featured label="My Total Sales" value={formatCurrency(metrics.totalSales)} />
        <KpiCard label="My Target" value={formatCurrency(metrics.targetAmount)} progress={metrics.achievedPercent} />
        <KpiCard
          label="My Target Achievement"
          value={`${metrics.achievedPercent}%`}
          progress={metrics.achievedPercent}
        />
        <KpiCard label="My Pipeline" value={formatCurrency(metrics.pipelineValue)} />
        <KpiCard label="My Won Deals" value={String(metrics.wonCount)} />
        <KpiCard label="My Active Deals" value={String(metrics.openDealsCount)} />
        <KpiCard label="My Pending Follow-ups" value={String(followUpCounts.pending)} />
        <KpiCard
          label="My Overdue Follow-ups"
          value={String(followUpCounts.overdue)}
          changeType={followUpCounts.overdue > 0 ? "negative" : "positive"}
        />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">My Sales Performance</h2>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Sales vs Target</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {formatCurrency(metrics.totalSales)} / {formatCurrency(metrics.targetAmount)}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {metrics.achievedPercent}% target achievement
              </p>
              <Progress
                value={metrics.achievedPercent}
                className="mt-6 h-3"
                indicatorClassName="bg-brand-lime"
              />
              <div className="mt-6 h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesVsTarget}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v / 100000}L`} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Bar dataKey="value" fill="#0B1914" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Monthly Sales</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={revenueChart}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v / 100000}L`} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Line type="monotone" dataKey="revenue" stroke="#0B1914" strokeWidth={2} name="Sales" />
                  <Line type="monotone" dataKey="target" stroke="#B3E64F" strokeWidth={2} strokeDasharray="5 5" name="Target" />
                  <Legend />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Won / Lost / Active</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={outcomeData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#B3E64F" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Active Pipeline</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/pipeline">
                  View board <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={pipeline} barGap={8}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v / 100000}L`} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Bar dataKey="value" fill="#0B1914" radius={[6, 6, 0, 0]} name="Value" />
                  <Bar dataKey="count" fill="#B3E64F" radius={[6, 6, 0, 0]} name="Count" />
                  <Legend />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>My Deals</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/deals">
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Deal name</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Expected close</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deals.slice(0, 6).map((deal) => (
                  <TableRow key={deal.id}>
                    <TableCell>
                      <Link href={`/deals/${deal.id}`} className="font-medium hover:underline">
                        {deal.title}
                      </Link>
                    </TableCell>
                    <TableCell>{deal.customerName}</TableCell>
                    <TableCell>{formatCurrency(deal.value)}</TableCell>
                    <TableCell>
                      <StatusBadge status={deal.stage} type="stage" />
                    </TableCell>
                    <TableCell>{formatDate(deal.expectedClose)}</TableCell>
                    <TableCell>{deal.stage === "won" || deal.stage === "lost" ? deal.stage : "open"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {deals.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">No deals assigned to you.</p>
            ) : null}
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>My Customers</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/customers">
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer name</TableHead>
                  <TableHead>Primary contact</TableHead>
                  <TableHead>Deal count</TableHead>
                  <TableHead>Deal value</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.slice(0, 6).map((customer) => {
                  const related = deals.filter((deal) => deal.customerId === customer.id);
                  return (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <Link href={`/customers/${customer.id}`} className="font-medium hover:underline">
                          {customer.name}
                        </Link>
                      </TableCell>
                      <TableCell>{customer.contactName}</TableCell>
                      <TableCell>{related.length}</TableCell>
                      <TableCell>{formatCurrency(related.reduce((sum, deal) => sum + deal.value, 0))}</TableCell>
                      <TableCell>
                        <StatusBadge status={customer.status} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {customers.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">No customers assigned to you.</p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>My Follow-ups</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/follow-ups">
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer / deal</TableHead>
                  <TableHead>Task</TableHead>
                  <TableHead>Due date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {followUps.slice(0, 6).map((item) => (
                  <TableRow
                    key={item.id}
                    className={item.status === "overdue" ? "bg-destructive/5" : undefined}
                  >
                    <TableCell>
                      {item.customerName}
                      <p className="text-xs text-muted-foreground">{item.dealTitle}</p>
                    </TableCell>
                    <TableCell className="font-medium">{item.title}</TableCell>
                    <TableCell>{formatDate(item.dueDate)}</TableCell>
                    <TableCell>
                      <StatusBadge status={item.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {followUps.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">No follow-ups assigned to you.</p>
            ) : null}
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>My Purchase Orders</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/purchase-orders">
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PO number</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Deal</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchaseOrders.slice(0, 6).map((po) => (
                  <TableRow key={po.id}>
                    <TableCell>
                      <Link href={`/purchase-orders/${po.id}`} className="font-medium hover:underline">
                        {po.poNumber}
                      </Link>
                    </TableCell>
                    <TableCell>{po.customerName}</TableCell>
                    <TableCell>{po.dealTitle}</TableCell>
                    <TableCell>{formatCurrency(po.amount)}</TableCell>
                    <TableCell>{formatDate(po.poDate)}</TableCell>
                    <TableCell>
                      <StatusBadge status={po.status} type="po" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {purchaseOrders.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">No purchase orders on your accounts.</p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent activity.</p>
          ) : (
            <ActivityTimeline activities={activities} />
          )}
        </CardContent>
      </Card>

      <DealFormDialog open={showDeal} onOpenChange={setShowDeal} />
      <CustomerFormDialog open={showCustomer} onOpenChange={setShowCustomer} />
      <ComposeEmailDialog open={showEmail} onOpenChange={setShowEmail} />
    </div>
  );
}
