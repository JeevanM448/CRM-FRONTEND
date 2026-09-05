"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, UsersRound } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader } from "@/components/ui/page-header";
import { KpiCard } from "@/components/ui/kpi-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { PerformanceBadge } from "@/components/sales-team/performance-badge";
import { ManagerFormDialog } from "@/components/sales-team/manager-form-dialog";
import { ActivityTimeline } from "@/components/ui/activity-timeline";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatCurrency, formatDate, getInitials } from "@/lib/utils";
import { useCRMStore, usePermissions } from "@/store/CRMStoreProvider";
import { userService } from "@/services";
import { toast } from "sonner";

export function ManagerMonitor({ managerId }: { managerId: string }) {
  const router = useRouter();
  const { can, canEditUsers, canActivateUsers, canAssignUsers } = usePermissions();
  const { getManagerDetail } = useCRMStore();
  const detail = getManagerDetail(managerId);

  const [editOpen, setEditOpen] = useState(false);
  const [statusConfirm, setStatusConfirm] = useState(false);

  const chartData = useMemo(() => {
    if (!detail) return [];
    return [
      { name: "Sales", value: detail.overview.totalSales },
      { name: "Target", value: detail.overview.targetAmount },
      { name: "Pipeline", value: detail.overview.totalPipeline },
    ];
  }, [detail]);

  const outcomeData = useMemo(() => {
    if (!detail) return [];
    return [
      { name: "Won", value: detail.overview.wonDeals },
      { name: "Lost", value: detail.overview.lostDeals },
      { name: "Active", value: detail.overview.activeDeals },
    ];
  }, [detail]);

  if (!can("USER_VIEW")) {
    return (
      <EmptyState
        icon={UsersRound}
        title="Access restricted"
        description="Manager 360 is available to administrators only."
      />
    );
  }

  if (!detail) {
    return (
      <EmptyState
        icon={UsersRound}
        title="Manager not found"
        description="This manager is not available in the organization."
        actionLabel="Back to Sales Team"
        onAction={() => router.push("/sales-team")}
      />
    );
  }

  const { user, overview, members, customers, deals, followUps, purchaseOrders, activities, pipeline } =
    detail;
  const inactive = user.status === "inactive";
  const activePipelineDeals = deals.filter((deal) => deal.stage !== "won" && deal.stage !== "lost");
  const memberHref = (id: string) => `/sales-team/${id}?fromManager=${user.id}`;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/sales-team"
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Sales Team
        </Link>
        <p className="text-xs text-muted-foreground">Sales Team / {user.name}</p>
      </div>

      <PageHeader
        title={user.name}
        description={`Manager · ${user.team ?? user.department}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={user.status} />
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              Edit manager
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <p className="text-muted-foreground">Name</p>
              <p className="font-medium">{user.name}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Email</p>
              <p className="font-medium break-all">{user.email}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Phone</p>
              <p className="font-medium">{user.phone || "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Team</p>
              <p className="font-medium">{user.team ?? user.department}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Account status</p>
              <StatusBadge status={user.status} />
            </div>
            <div>
              <p className="text-muted-foreground">Team members</p>
              <p className="font-medium">{overview.totalSalespeople}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Management</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {canEditUsers ? (
              <Button variant="outline" onClick={() => setEditOpen(true)}>
                Edit profile, team, status
              </Button>
            ) : null}
            {canActivateUsers ? (
              <Button variant={inactive ? "accent" : "outline"} onClick={() => setStatusConfirm(true)}>
                {inactive ? "Activate manager" : "Deactivate manager"}
              </Button>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Team Performance</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          <KpiCard
            label="Team Target"
            value={overview.targetAmount ? formatCurrency(overview.targetAmount) : "No data"}
          />
          <KpiCard label="Team Achieved Sales" value={formatCurrency(overview.totalSales)} featured />
          <KpiCard label="Remaining Target" value={formatCurrency(overview.remaining)} />
          <KpiCard
            label="Achievement %"
            value={`${overview.targetAchievement}%`}
            progress={Math.min(100, overview.targetAchievement)}
          />
          <KpiCard label="Pipeline Value" value={formatCurrency(overview.totalPipeline)} />
          <KpiCard label="Won Deals" value={String(overview.wonDeals)} />
          <KpiCard label="Active Deals" value={String(overview.activeDeals)} />
          <KpiCard label="Closed Deals" value={String(overview.closedDeals)} />
          <KpiCard label="Win Rate" value={`${overview.winRate}%`} />
        </div>
      </div>

      <Tabs defaultValue="team">
        <TabsList className="flex h-auto w-full flex-wrap justify-start">
          <TabsTrigger value="team">Team Members</TabsTrigger>
          <TabsTrigger value="deals">Deals</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="pos">Purchase Orders</TabsTrigger>
          <TabsTrigger value="follow-ups">Follow-ups</TabsTrigger>
          <TabsTrigger value="activity">Recent Activities</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="team">
          {members.length === 0 ? (
            <EmptyState icon={UsersRound} title="No team members" description="This manager has no assigned salespeople." />
          ) : (
            <>
              <div className="space-y-3 md:hidden">
                {members.map((row) => (
                  <Link key={row.id} href={memberHref(row.id)}>
                    <Card className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold">{row.name}</p>
                          <p className="text-sm text-muted-foreground break-all">{row.email}</p>
                        </div>
                        <StatusBadge status={row.status} />
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                        <p>Target: {formatCurrency(row.target)}</p>
                        <p>Sales: {formatCurrency(row.sales)}</p>
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
                        <TableHead>Target</TableHead>
                        <TableHead>Achieved sales</TableHead>
                        <TableHead>Achievement</TableHead>
                        <TableHead>Pipeline</TableHead>
                        <TableHead>Active deals</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {members.map((row) => (
                        <TableRow
                          key={row.id}
                          className="cursor-pointer"
                          onClick={() => router.push(memberHref(row.id))}
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
                          <TableCell>{formatCurrency(row.target)}</TableCell>
                          <TableCell>{formatCurrency(row.sales)}</TableCell>
                          <TableCell>{row.achievement}%</TableCell>
                          <TableCell>{formatCurrency(row.pipeline)}</TableCell>
                          <TableCell>{row.activeCount}</TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <StatusBadge status={row.status} />
                              <PerformanceBadge status={row.performance} />
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
        </TabsContent>

        <TabsContent value="deals">
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Deal</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Salesperson</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Expected close</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deals.map((deal) => (
                    <TableRow key={deal.id}>
                      <TableCell>
                        <Link href={`/deals/${deal.id}`} className="font-medium hover:underline">
                          {deal.title}
                        </Link>
                      </TableCell>
                      <TableCell>{deal.customerName}</TableCell>
                      <TableCell>{deal.owner}</TableCell>
                      <TableCell>
                        <StatusBadge status={deal.stage} type="stage" />
                      </TableCell>
                      <TableCell>{formatCurrency(deal.value)}</TableCell>
                      <TableCell>{formatDate(deal.expectedClose)}</TableCell>
                      <TableCell>
                        {deal.stage === "won" || deal.stage === "lost" ? "Closed" : "Active"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="pipeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Deal stages</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pipeline}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0b1914" radius={6} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Deal</TableHead>
                    <TableHead>Salesperson</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead>Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activePipelineDeals.map((deal) => (
                    <TableRow key={deal.id}>
                      <TableCell>
                        <Link href={`/deals/${deal.id}`} className="font-medium hover:underline">
                          {deal.title}
                        </Link>
                      </TableCell>
                      <TableCell>{deal.owner}</TableCell>
                      <TableCell>
                        <StatusBadge status={deal.stage} type="stage" />
                      </TableCell>
                      <TableCell>{formatCurrency(deal.value)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="customers">
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Deal count</TableHead>
                    <TableHead>Total value</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((customer) => {
                    const related = deals.filter((d) => d.customerId === customer.id);
                    return (
                      <TableRow key={customer.id}>
                        <TableCell>
                          <Link href={`/customers/${customer.id}`} className="font-medium hover:underline">
                            {customer.name}
                          </Link>
                        </TableCell>
                        <TableCell>{customer.owner}</TableCell>
                        <TableCell>{customer.contactName}</TableCell>
                        <TableCell>{related.length}</TableCell>
                        <TableCell>
                          {formatCurrency(related.reduce((sum, d) => sum + d.value, 0))}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={customer.status} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="pos">
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PO number</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Salesperson</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchaseOrders.map((po) => (
                    <TableRow key={po.id}>
                      <TableCell>
                        <Link href={`/purchase-orders/${po.id}`} className="font-medium hover:underline">
                          {po.poNumber}
                        </Link>
                      </TableCell>
                      <TableCell>{po.customerName}</TableCell>
                      <TableCell>{po.owner}</TableCell>
                      <TableCell>{formatCurrency(po.amount)}</TableCell>
                      <TableCell>{formatDate(po.poDate)}</TableCell>
                      <TableCell>
                        <StatusBadge status={po.status} type="po" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="follow-ups">
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Follow-up</TableHead>
                    <TableHead>Salesperson</TableHead>
                    <TableHead>Customer / deal</TableHead>
                    <TableHead>Due date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {followUps.map((item) => (
                    <TableRow key={item.id} className={item.status === "overdue" ? "bg-destructive/5" : undefined}>
                      <TableCell className="font-medium">{item.title}</TableCell>
                      <TableCell>{item.owner}</TableCell>
                      <TableCell>
                        {item.customerName}
                        <p className="text-xs text-muted-foreground">{item.dealTitle}</p>
                      </TableCell>
                      <TableCell>{formatDate(item.dueDate)}</TableCell>
                      <TableCell>
                        <StatusBadge status={item.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Recent activities</CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityTimeline activities={activities.slice(0, 12)} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              label="Target achievement"
              value={`${overview.targetAchievement}%`}
              progress={Math.min(100, overview.targetAchievement)}
            />
            <KpiCard label="Win rate" value={`${overview.winRate}%`} />
            <KpiCard label="Pipeline" value={formatCurrency(overview.totalPipeline)} />
            <KpiCard
              label="Follow-up completion"
              value={`${overview.followUpCompletion}%`}
              progress={overview.followUpCompletion}
            />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Sales vs target</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Bar dataKey="value" fill="#0b1914" radius={6} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Won / lost / active</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={outcomeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#b3e64f" radius={6} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <ManagerFormDialog open={editOpen} onOpenChange={setEditOpen} user={user} />
      <ConfirmDialog
        open={statusConfirm}
        onOpenChange={setStatusConfirm}
        title={inactive ? "Activate manager?" : "Deactivate manager?"}
        description={
          inactive
            ? `${user.name} will be treated as active in the sales organization again. Historical records stay in place.`
            : `${user.name} will no longer be treated as active in the sales organization. Historical records are kept and the manager is not deleted.`
        }
        confirmLabel={inactive ? "Activate" : "Deactivate"}
        variant={inactive ? "default" : "destructive"}
        onConfirm={async () => {
          try {
            await userService.updateUser(user.id, {
              status: inactive ? "active" : "inactive",
            });
            toast.success(inactive ? "Manager activated" : "Manager deactivated");
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Status was not updated");
          }
        }}
      />
    </div>
  );
}
