import type { AppNotification, CRMState, NotificationSeverity, NotificationType } from "./types";
import { generateId } from "./storage";

export type { NotificationSeverity, NotificationType };

export function normalizeNotification(
  notification: Partial<AppNotification> &
    Pick<AppNotification, "id" | "userId" | "title" | "message" | "type">
): AppNotification {
  const timestamp = notification.timestamp ?? new Date().toISOString();
  return {
    id: notification.id,
    userId: notification.userId,
    title: notification.title,
    message: notification.message,
    type: notification.type,
    severity: notification.severity ?? "info",
    read: notification.read ?? false,
    timestamp,
    href: notification.href,
    entityType: notification.entityType,
    entityId: notification.entityId,
    metadata: notification.metadata,
  };
}

export function createNotification(
  current: AppNotification[],
  notification: Omit<AppNotification, "id" | "timestamp" | "read" | "severity"> & {
    severity?: AppNotification["severity"];
    read?: boolean;
  }
): AppNotification[] {
  const item = normalizeNotification({
    id: generateId("notif"),
    timestamp: new Date().toISOString(),
    read: notification.read ?? false,
    ...notification,
  });
  return [item, ...current].slice(0, 200);
}

export function buildAdminSystemNotifications(state: CRMState): AppNotification[] {
  const admin = state.users.find((user) => user.role === "admin");
  if (!admin) return [];

  const generated: AppNotification[] = [];
  const now = new Date().toISOString();

  const pendingRequests = state.teamRequests.filter((item) => item.status === "pending");
  if (pendingRequests.length > 0) {
    generated.push(
      normalizeNotification({
        id: "sys-team-requests",
        userId: admin.id,
        title: "Pending team requests",
        message: `${pendingRequests.length} team request(s) awaiting approval`,
        type: "team_request",
        severity: "warning",
        read: false,
        timestamp: now,
        href: "/team-requests",
        entityType: "team_request",
        entityId: pendingRequests[0]?.id,
      })
    );
  }

  const reviewPos = state.purchaseOrders.filter((item) =>
    ["pending", "received"].includes(item.status)
  );
  if (reviewPos.length > 0 && state.organization.businessRules.poReviewRequired) {
    generated.push(
      normalizeNotification({
        id: "sys-po-review",
        userId: admin.id,
        title: "POs requiring review",
        message: `${reviewPos.length} purchase order(s) need review`,
        type: "po",
        severity: "warning",
        read: false,
        timestamp: now,
        href: "/purchase-orders",
        entityType: "purchase_order",
        entityId: reviewPos[0]?.id,
      })
    );
  }

  const failedWorkflows = state.workflows.filter((item) => (item.failedRuns ?? 0) > 0);
  if (failedWorkflows.length > 0) {
    generated.push(
      normalizeNotification({
        id: "sys-automation-fail",
        userId: admin.id,
        title: "Automation failures",
        message: `${failedWorkflows.length} workflow(s) reported errors`,
        type: "automation",
        severity: "critical",
        read: false,
        timestamp: now,
        href: "/automation",
        entityType: "automation",
        entityId: failedWorkflows[0]?.id,
      })
    );
  }

  const failedAI = (state.aiExecutions ?? []).filter((item) => item.status === "failed");
  if (failedAI.length > 0) {
    generated.push(
      normalizeNotification({
        id: "sys-ai-fail",
        userId: admin.id,
        title: "AI processing failures",
        message: `${failedAI.length} AI execution(s) failed`,
        type: "ai",
        severity: "critical",
        read: false,
        timestamp: now,
        href: "/ai",
        entityType: "ai_execution",
        entityId: failedAI[0]?.id,
      })
    );
  }

  const waitingAI = (state.aiExecutions ?? []).filter((item) => item.status === "waiting_approval");
  if (waitingAI.length > 0) {
    generated.push(
      normalizeNotification({
        id: "sys-ai-approval",
        userId: admin.id,
        title: "AI approval required",
        message: `${waitingAI.length} AI result(s) waiting for approval`,
        type: "ai",
        severity: "warning",
        read: false,
        timestamp: now,
        href: "/ai",
        entityType: "ai_execution",
        entityId: waitingAI[0]?.id,
      })
    );
  }

  const reviewDocuments = (state.documents ?? []).filter(
    (item) => item.status === "REQUIRES_REVIEW"
  );
  if (reviewDocuments.length > 0) {
    generated.push(
      normalizeNotification({
        id: "sys-doc-review",
        userId: admin.id,
        title: "Documents require review",
        message: `${reviewDocuments.length} document(s) need human review`,
        type: "document",
        severity: "warning",
        read: false,
        timestamp: now,
        href: "/data-management/documents",
        entityType: "document",
        entityId: reviewDocuments[0]?.id,
      })
    );
  }

  const failedDocuments = (state.documents ?? []).filter((item) => item.status === "FAILED");
  if (failedDocuments.length > 0) {
    generated.push(
      normalizeNotification({
        id: "sys-doc-fail",
        userId: admin.id,
        title: "Document processing failures",
        message: `${failedDocuments.length} document(s) failed processing`,
        type: "document",
        severity: "critical",
        read: false,
        timestamp: now,
        href: "/data-management/documents",
        entityType: "document",
        entityId: failedDocuments[0]?.id,
      })
    );
  }

  const inactiveTeams = state.organization.teams.filter((team) => team.status === "inactive");
  inactiveTeams.forEach((team) => {
    const members = state.users.filter((user) => user.team === team.name).length;
    if (members > 0) {
      generated.push(
        normalizeNotification({
          id: `sys-inactive-team-${team.id}`,
          userId: admin.id,
          title: "Inactive team has members",
          message: `${team.name} is inactive but still has ${members} assigned employee(s)`,
          type: "system",
          severity: "warning",
          read: false,
          timestamp: now,
          href: "/organization-settings",
          entityType: "team",
          entityId: team.id,
        })
      );
    }
  });

  const zeroTargets = state.salesTargets.filter(
    (item) => item.status === "active" && item.targetAmount <= 0
  );
  if (zeroTargets.length > 0) {
    generated.push(
      normalizeNotification({
        id: "sys-target-config",
        userId: admin.id,
        title: "Target configuration issue",
        message: `${zeroTargets.length} active target(s) have zero amount configured`,
        type: "target",
        severity: "info",
        read: false,
        timestamp: now,
        href: "/targets",
        entityType: "sales_target",
        entityId: zeroTargets[0]?.id,
      })
    );
  }

  const emailSyncIssues = state.emailIntegrations.filter(
    (item) => item.status === "error" || item.lastSyncStatus === "failed"
  );
  if (emailSyncIssues.length > 0) {
    generated.push(
      normalizeNotification({
        id: "sys-email-sync-fail",
        userId: admin.id,
        title: "Email sync failures",
        message: `${emailSyncIssues.length} email integration(s) require attention`,
        type: "email",
        severity: "critical",
        read: false,
        timestamp: now,
        href: "/email-integrations",
        entityType: "email_integration",
        entityId: emailSyncIssues[0]?.id,
      })
    );
  }

  const disconnectedIntegrations = state.emailIntegrations.filter(
    (item) => item.status === "disconnected" && item.connectedAt
  );
  if (disconnectedIntegrations.length > 0) {
    generated.push(
      normalizeNotification({
        id: "sys-email-disconnected",
        userId: admin.id,
        title: "Email integrations disconnected",
        message: `${disconnectedIntegrations.length} account(s) are disconnected`,
        type: "email",
        severity: "warning",
        read: false,
        timestamp: now,
        href: "/email-integrations",
        entityType: "email_integration",
        entityId: disconnectedIntegrations[0]?.id,
      })
    );
  }

  return generated;
}

export function mergeAdminNotifications(
  current: AppNotification[],
  generated: AppNotification[]
): AppNotification[] {
  const systemIds = new Set(generated.map((item) => item.id));
  const preserved = current.filter((item) => !systemIds.has(item.id));
  return [...generated, ...preserved].slice(0, 200);
}

export function filterNotifications(
  notifications: AppNotification[],
  filter: "all" | "unread" | "critical" | "warnings"
) {
  if (filter === "unread") return notifications.filter((item) => !item.read);
  if (filter === "critical") return notifications.filter((item) => item.severity === "critical");
  if (filter === "warnings") return notifications.filter((item) => item.severity === "warning");
  return notifications;
}

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  email: "Email",
  deal: "Deal",
  "follow-up": "Follow-up",
  po: "Purchase Order",
  ai: "AI",
  system: "System",
  team_request: "Team Request",
  automation: "Automation",
  target: "Target",
  security: "Security",
  document: "Document",
  system_health: "System Health",
  backup: "Backup",
};

export const SEVERITY_LABELS: Record<NotificationSeverity, string> = {
  info: "Info",
  warning: "Warning",
  critical: "Critical",
  success: "Success",
};
