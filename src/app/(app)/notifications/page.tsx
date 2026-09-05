"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, ShieldAlert } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/ui/status-badge";
import { KpiCard } from "@/components/ui/kpi-card";
import { useCRMStore, usePermissions } from "@/store/CRMStoreProvider";
import { NOTIFICATION_TYPE_LABELS, SEVERITY_LABELS } from "@/store/notifications";
import { formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default function NotificationsPage() {
  const { canViewNotifications, role } = usePermissions();
  const {
    getNotifications,
    getAdminNotifications,
    syncAdminNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    getUnreadNotificationCount,
  } = useCRMStore();
  const [filter, setFilter] = useState<"all" | "unread" | "critical" | "warnings">("all");
  const isManager = role === "sales_manager";
  const isAdmin = role === "admin";
  const isSalesperson = role === "salesperson";

  useEffect(() => {
    if (isAdmin) syncAdminNotifications();
  }, [syncAdminNotifications, isAdmin]);

  const notifications = isAdmin
    ? getAdminNotifications(filter)
    : getNotifications().filter((item) => {
        if (filter === "unread") return !item.read;
        if (filter === "critical") return item.severity === "critical";
        if (filter === "warnings") return item.severity === "warning";
        return true;
      });

  const unreadCount = getUnreadNotificationCount();

  if (!canViewNotifications) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="Access restricted"
        description="You do not have permission to view notifications."
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={isManager ? "Team Notifications" : isSalesperson ? "My Notifications" : "Notifications"}
        description={
          isAdmin
            ? "Organization events requiring admin attention."
            : isManager
              ? "Alerts and updates for your team activity."
              : "Your CRM notifications and reminders."
        }
        actions={
          <Button variant="outline" onClick={() => markAllNotificationsRead()}>
            Mark all as read
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard label="Total" value={String(notifications.length)} featured />
        <KpiCard label="Unread" value={String(unreadCount)} />
        <KpiCard
          label="Critical"
          value={String(notifications.filter((item) => item.severity === "critical").length)}
        />
      </div>

      <Tabs value={filter} onValueChange={(value) => setFilter(value as typeof filter)}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">Unread</TabsTrigger>
          <TabsTrigger value="critical">Critical</TabsTrigger>
          <TabsTrigger value="warnings">Warnings</TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="space-y-3 pt-4">
          {notifications.length === 0 ? (
            <EmptyState icon={Bell} title="No notifications" description="You're all caught up." />
          ) : (
            notifications.map((notification) => (
              <Card
                key={notification.id}
                className={cn(!notification.read && "border-brand-lime/40 bg-brand-lime/5")}
              >
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{notification.title}</p>
                      <StatusBadge
                        status={
                          notification.severity === "critical"
                            ? "inactive"
                            : notification.severity === "warning"
                              ? "pending"
                              : "active"
                        }
                      />
                      <span className="text-xs text-muted-foreground">
                        {NOTIFICATION_TYPE_LABELS[notification.type]}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{notification.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {SEVERITY_LABELS[notification.severity]} · {formatDateTime(notification.timestamp)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {!notification.read ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => markNotificationRead(notification.id)}
                      >
                        Mark read
                      </Button>
                    ) : null}
                    {notification.href ? (
                      <Button variant="accent" size="sm" asChild>
                        <Link href={notification.href}>Open</Link>
                      </Button>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
