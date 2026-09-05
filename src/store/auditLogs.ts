import type {
  AuditAction,
  AuditEntityType,
  AuditLog,
  AuditValue,
  CRMState,
} from "./types";
import { generateId } from "./storage";
import { getUserById } from "./helpers";

export type CreateAuditLogInput = {
  actorId?: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  timestamp?: string;
  previousValue?: AuditValue;
  newValue?: AuditValue;
  metadata?: AuditValue;
};

export interface AuditLogView extends AuditLog {
  actorName: string;
  actorEmail: string;
  actorRole?: string;
}

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  created: "Created",
  updated: "Updated",
  deleted: "Deleted",
  approved: "Approved",
  rejected: "Rejected",
  assigned: "Assigned",
  unassigned: "Unassigned",
  activated: "Activated",
  deactivated: "Deactivated",
  login: "Login",
  logout: "Logout",
  login_failed: "Login Failed",
  account_created: "Account Created",
  account_disabled: "Account Disabled",
  account_enabled: "Account Enabled",
  account_updated: "Account Updated",
  password_reset_requested: "Password Reset Requested",
  exported: "Exported",
  imported: "Imported",
  connected: "Connected",
  disconnected: "Disconnected",
  reconnected: "Reconnected",
};

export const AUDIT_ENTITY_LABELS: Record<AuditEntityType, string> = {
  user: "User",
  customer: "Customer",
  contact: "Contact",
  deal: "Deal",
  purchase_order: "Purchase Order",
  follow_up: "Follow-up",
  team_request: "Team Request",
  sales_target: "Sales Target",
  automation: "Automation Workflow",
  automation_execution: "Automation Execution",
  ai_configuration: "AI Configuration",
  ai_capability: "AI Capability",
  ai_execution: "AI Execution",
  email: "Email",
  email_integration: "Email Integration",
  document: "Document",
  system_health: "System Health",
  backup: "Backup",
  system: "System",
  organization: "Organization",
  team: "Team",
  region: "Region",
  user_account: "User Account",
};

export const IMPORTANT_AUDIT_ACTIONS: AuditAction[] = [
  "approved",
  "rejected",
  "assigned",
  "unassigned",
  "activated",
  "deactivated",
  "login",
  "logout",
  "login_failed",
  "account_created",
  "account_disabled",
  "account_enabled",
  "account_updated",
  "password_reset_requested",
  "exported",
  "imported",
];

export function appendAuditLogs(current: CRMState, entries: CreateAuditLogInput[]): AuditLog[] {
  const logs = [...(current.auditLogs ?? [])];
  for (const entry of entries) {
    const actorId = entry.actorId ?? current.currentUserId;
    if (!actorId) continue;
    logs.unshift({
      id: generateId("audit"),
      actorId,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      timestamp: entry.timestamp ?? new Date().toISOString(),
      previousValue: entry.previousValue,
      newValue: entry.newValue,
      metadata: entry.metadata,
    });
  }
  return logs;
}

export function toAuditLogView(state: CRMState, log: AuditLog): AuditLogView {
  const actor = getUserById(state, log.actorId);
  return {
    ...log,
    actorName: actor?.name ?? "Unknown user",
    actorEmail: actor?.email ?? "",
    actorRole: actor?.role,
  };
}
