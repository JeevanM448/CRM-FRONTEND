"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, AlertTriangle, Briefcase, Kanban, Mail, Target, UsersRound } from "lucide-react";
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
import { SalespersonFormDialog } from "@/components/sales-team/salesperson-form-dialog";
import { ActivityTimeline } from "@/components/ui/activity-timeline";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DealFormDialog } from "@/components/deals/deal-form-dialog";
import { FollowUpFormDialog } from "@/components/email/compose-email-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate, getInitials } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useCRMStore, usePermissions } from "@/store/CRMStoreProvider";
import { userService } from "@/services";
import type { Deal } from "@/types";
import { toast } from "sonner";

const roleLabels: Record<string, string> = {
  admin: "Admin",
  sales_manager: "Manager",
  salesperson: "Salesperson",
  viewer: "Viewer",
};

interface SalespersonMonitorProps {
  userId: string;
  backHref: string;
  backLabel: string;
  crumb: string;
  allowTeamChange?: boolean;
  allowReassign?: boolean;
  mode?: "admin" | "manager";
}

export function SalespersonMonitor({
  userId,
  backHref,
  backLabel,
  crumb,
  allowTeamChange = false,
  allowReassign = false,
  mode = "admin",
}: SalespersonMonitorProps) {
  const router = useRouter();
  const { canEditUsers, canAssignUsers } = usePermissions();
  const { getSalespersonDetail, getTeamMember360Data, getUsers } = useCRMStore();
  const isManagerView = mode === "manager";
  const team360 = isManagerView ? getTeamMember360Data(userId) : null;
  const detail = isManagerView ? team360?.detail : getSalespersonDetail(userId);
  const canManage =
    (canEditUsers || canAssignUsers) && allowTeamChange && detail?.user.role === "salesperson";

  const [editOpen, setEditOpen] = useState(false);
  const [statusConfirm, setStatusConfirm] = useState(false);
  const [editDeal, setEditDeal] = useState<Deal | undefined>();
  const [editFollowUpId, setEditFollowUpId] = useState<string | undefined>();

  const chartData = useMemo(() => {
    if (!detail) return [];
    return [
      { name: "Sales", value: detail.metrics.sales },
      { name: "Target", value: detail.metrics.target },
      { name: "Pipeline", value: detail.metrics.pipeline },
    ];
  }, [detail]);

  const outcomeData = useMemo(() => {
    if (!detail) return [];
    return [
      { name: "Won", value: detail.metrics.wonCount },
      { name: "Lost", value: detail.metrics.lostCount },
      { name: "Active", value: detail.metrics.activeCount },
    ];
  }, [detail]);

  if (isManagerView && !team360) {
    return (
      <EmptyState
        icon={UsersRound}
        title="Access restricted"
        description="This salesperson is not on your team. This is a frontend navigation check only, not production authorization."
        actionLabel={backLabel}
        onAction={() => router.push(backHref)}
      />
    );
  }

  if (!detail) {
    return (
      <EmptyState
        icon={UsersRound}
        title="Salesperson not found"
        description="This person is not available in the current team scope."
        actionLabel={backLabel}
        onAction={() => router.push(backHref)}
      />
    );
  }

  const { user, metrics, performance, customers, deals, followUps, purchaseOrders, activities } =
    detail;
  const manager =
    team360?.manager ??
    (user.managerId ? getUsers().find((item) => item.id === user.managerId) : undefined);
  const contacts = team360?.contacts ?? [];
  const emails = team360?.emails ?? [];
  const attentionItems = team360?.attentionItems ?? [];
  const winRate = team360?.kpis.winRate ?? (
    metrics.wonCount + metrics.lostCount > 0
      ? Math.round((metrics.wonCount / (metrics.wonCount + metrics.lostCount)) * 100)
      : 0
  );
  const remaining = Math.max(0, metrics.target - metrics.sales);
  const inactive = user.status === "inactive";
  const managerQuickActions = [
    { label: "View Deals", href: "/deals", icon: Briefcase },
    { label: "View Pipeline", href: "/pipeline", icon: Kanban },
    { label: "View Customers", href: "/customers", icon: UsersRound },
    { label: "View Follow-ups", href: "/follow-ups", icon: Target },
    { label: "Team Reports", href: "/reports", icon: Mail },
  ] as const;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={backHref}
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </Link>
        <p className="text-xs text-muted-foreground">
          {crumb} / {user.name}
        </p>
      </div>

      <PageHeader
        title={user.name}
        description={`${roleLabels[user.role]} · ${user.team ?? user.department}${user.title ? ` · ${user.title}` : ""}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-brand-lime/20 text-primary">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <StatusBadge status={user.status} />
            <PerformanceBadge status={performance} />
            {canManage ? (
              <Button variant="outline" onClick={() => setEditOpen(true)}>
                Edit salesperson
              </Button>
            ) : null}
          </div>
        }
      />

      {isManagerView ? (
        <p className="text-sm text-muted-foreground">
          Team member on {manager?.name ?? "your team"} · {user.team ?? user.department}
        </p>
      ) : null}

      {isManagerView ? (
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              <Button variant="outline" className="justify-start" asChild>
                <Link href={backHref}>
                  <ArrowLeft className="h-4 w-4" />
                  Back to My Team
                </Link>
              </Button>
              {managerQuickActions.map((action) => (
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
      ) : null}

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
              <p className="text-muted-foreground">Manager</p>
              <p className="font-medium">{manager?.name ?? "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Team</p>
              <p className="font-medium">{user.team ?? user.department}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Status</p>
              <StatusBadge status={user.status} />
            </div>
            <div>
              <p className="text-muted-foreground">Title</p>
              <p className="font-medium">{user.title || "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Last active</p>
              <p className="font-medium">{user.lastActive ? formatDate(user.lastActive) : "—"}</p>
            </div>
          </CardContent>
        </Card>

        {canManage ? (
          <Card>
            <CardHeader>
              <CardTitle>Management</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => setEditOpen(true)}>
                Edit profile, manager, team, target
              </Button>
              <Button variant={inactive ? "accent" : "outline"} onClick={() => setStatusConfirm(true)}>
                {inactive ? "Activate salesperson" : "Deactivate salesperson"}
              </Button>
            </CardContent>
          </Card>
        ) : null}
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Performance</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          <KpiCard label="Sales Achieved" value={formatCurrency(metrics.sales)} featured />
          <KpiCard label="Target" value={metrics.target ? formatCurrency(metrics.target) : "No target"} />
          <KpiCard
            label="Target Achievement"
            value={`${metrics.achievement}%`}
            progress={Math.min(100, metrics.achievement)}
          />
          <KpiCard label="Open Pipeline" value={formatCurrency(metrics.pipeline)} />
          <KpiCard label="Won Deals" value={String(metrics.wonCount)} />
          <KpiCard
            label="Win Rate"
            value={`${winRate}%`}
            subValue={
              metrics.wonCount + metrics.lostCount > 0
                ? `${metrics.wonCount} won / ${metrics.wonCount + metrics.lostCount} closed`
                : "No closed deals yet"
            }
          />
          <KpiCard label="Active Deals" value={String(metrics.activeCount)} />
          <KpiCard label="Lost Deals" value={String(metrics.lostCount)} />
          <KpiCard label="Remaining to Target" value={formatCurrency(remaining)} />
          <KpiCard label="Pending Follow-ups" value={String(metrics.pendingFollowUps)} />
          <KpiCard
            label="Overdue Follow-ups"
            value={String(metrics.overdueCount)}
            changeType={metrics.overdueCount > 0 ? "negative" : "positive"}
          />
        </div>
      </div>

      {isManagerView && attentionItems.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Attention Items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {attentionItems.map((item) => (
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
                {item.priority ? <StatusBadge status={item.priority} type="priority" /> : null}
              </Link>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <Tabs defaultValue="activity">
        <TabsList className="flex h-auto w-full flex-wrap justify-start">
          <TabsTrigger value="activity">Sales activity</TabsTrigger>
          <TabsTrigger value="deals">Deals</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          {isManagerView ? <TabsTrigger value="contacts">Contacts</TabsTrigger> : null}
          <TabsTrigger value="follow-ups">Follow-ups</TabsTrigger>
          <TabsTrigger value="pos">Purchase Orders</TabsTrigger>
          {isManagerView ? <TabsTrigger value="emails">Emails</TabsTrigger> : null}
          <TabsTrigger value="overview">Reporting</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
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
          <KpiCard
            label="Follow-up completion"
            value={`${metrics.followUpCompletion}%`}
            subValue={`${metrics.completedFollowUps} of ${metrics.followUpCount} completed`}
            progress={metrics.followUpCompletion}
          />
        </TabsContent>

        <TabsContent value="deals">
          <Card className="overflow-hidden">
            {deals.length === 0 ? (
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                No deals for this salesperson yet.
              </CardContent>
            ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Deal</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead>Expected close</TableHead>
                    {allowReassign ? <TableHead></TableHead> : null}
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
                      <TableCell>{formatCurrency(deal.value)}</TableCell>
                      <TableCell>
                        <StatusBadge status={deal.stage} type="stage" />
                      </TableCell>
                      <TableCell>{formatDate(deal.expectedClose)}</TableCell>
                      {allowReassign ? (
                        <TableCell>
                          <Button variant="outline" size="sm" onClick={() => setEditDeal(deal)}>
                            Reassign
                          </Button>
                        </TableCell>
                      ) : null}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="customers">
          <Card className="overflow-hidden">
            {customers.length === 0 ? (
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                No customers assigned to this salesperson yet.
              </CardContent>
            ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
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
            )}
          </Card>
        </TabsContent>

        {isManagerView ? (
          <TabsContent value="contacts">
            <Card className="overflow-hidden">
              {contacts.length === 0 ? (
                <CardContent className="py-10 text-center text-sm text-muted-foreground">
                  No contacts linked to this salesperson yet.
                </CardContent>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Contact</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Last contact</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contacts.map((contact) => (
                        <TableRow key={contact.id}>
                          <TableCell className="font-medium">{contact.name}</TableCell>
                          <TableCell>{contact.company}</TableCell>
                          <TableCell className="break-all">{contact.email}</TableCell>
                          <TableCell>{contact.phone || "—"}</TableCell>
                          <TableCell>{formatDate(contact.lastContact)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </Card>
          </TabsContent>
        ) : null}

        <TabsContent value="follow-ups">
          <Card className="overflow-hidden">
            {followUps.length === 0 ? (
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                No follow-ups for this salesperson yet.
              </CardContent>
            ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Follow-up</TableHead>
                    <TableHead>Customer / deal</TableHead>
                    <TableHead>Due date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assigned</TableHead>
                    {allowReassign ? <TableHead></TableHead> : null}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {followUps.map((item) => (
                    <TableRow key={item.id} className={item.status === "overdue" ? "bg-destructive/5" : undefined}>
                      <TableCell className="font-medium">{item.title}</TableCell>
                      <TableCell>
                        {item.customerName}
                        <p className="text-xs text-muted-foreground">{item.dealTitle}</p>
                      </TableCell>
                      <TableCell>{formatDate(item.dueDate)}</TableCell>
                      <TableCell>
                        <StatusBadge status={item.status} />
                      </TableCell>
                      <TableCell>{item.owner}</TableCell>
                      {allowReassign ? (
                        <TableCell>
                          <Button variant="outline" size="sm" onClick={() => setEditFollowUpId(item.id)}>
                            Assign / edit
                          </Button>
                        </TableCell>
                      ) : null}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="pos">
          <Card className="overflow-hidden">
            {purchaseOrders.length === 0 ? (
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                No purchase orders for this salesperson yet.
              </CardContent>
            ) : (
            <div className="overflow-x-auto">
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
                  {purchaseOrders.map((po) => (
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
            </div>
            )}
          </Card>
        </TabsContent>

        {isManagerView ? (
          <TabsContent value="emails">
            <Card className="overflow-hidden">
              {emails.length === 0 ? (
                <CardContent className="py-10 text-center text-sm text-muted-foreground">
                  No email activity linked to this salesperson&apos;s customers or deals yet.
                </CardContent>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Subject</TableHead>
                        <TableHead>Customer / deal</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Folder</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {emails.map((email) => (
                        <TableRow key={email.id}>
                          <TableCell>
                            <Link href="/inbox" className="font-medium hover:underline">
                              {email.subject}
                            </Link>
                          </TableCell>
                          <TableCell>
                            {email.customerName ?? email.dealTitle ?? "—"}
                          </TableCell>
                          <TableCell>{formatDate(email.date)}</TableCell>
                          <TableCell className="capitalize">{email.folder}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </Card>
          </TabsContent>
        ) : null}

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Recent activities</CardTitle>
            </CardHeader>
            <CardContent>
              {activities.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recent activity for this salesperson.</p>
              ) : (
                <ActivityTimeline activities={activities.slice(0, 12)} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <DealFormDialog
        open={Boolean(editDeal)}
        onOpenChange={(open) => {
          if (!open) setEditDeal(undefined);
        }}
        deal={editDeal}
      />
      <FollowUpFormDialog
        open={Boolean(editFollowUpId)}
        onOpenChange={(open) => {
          if (!open) setEditFollowUpId(undefined);
        }}
        followUpId={editFollowUpId}
      />

      {canManage ? (
        <>
          <SalespersonFormDialog
            open={editOpen}
            onOpenChange={setEditOpen}
            user={user}
            targetAmount={metrics.target}
          />
          <ConfirmDialog
            open={statusConfirm}
            onOpenChange={setStatusConfirm}
            title={inactive ? "Activate salesperson?" : "Deactivate salesperson?"}
            description={
              inactive
                ? `${user.name} will be treated as active in the sales organization again. Historical records stay in place.`
                : `${user.name} will no longer be treated as active in the sales organization. Historical records are kept and the salesperson is not deleted.`
            }
            confirmLabel={inactive ? "Activate" : "Deactivate"}
            variant={inactive ? "default" : "destructive"}
            onConfirm={async () => {
              try {
                await userService.updateUser(user.id, {
                  status: inactive ? "active" : "inactive",
                });
                toast.success(inactive ? "Salesperson activated" : "Salesperson deactivated");
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Status was not updated");
              }
            }}
          />
        </>
      ) : null}
    </div>
  );
}
