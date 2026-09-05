import type { User, UserRole } from "@/types";

/** Configurable portal roles — custom roles are not supported yet. */
export type PortalRole = Extract<UserRole, "admin" | "sales_manager" | "salesperson">;

export const PORTAL_ROLES: PortalRole[] = ["admin", "sales_manager", "salesperson"];

export const ROLE_LABELS: Record<PortalRole, string> = {
  admin: "Admin",
  sales_manager: "Manager",
  salesperson: "Salesperson",
};

export type Permission =
  | "USER_VIEW"
  | "USER_CREATE"
  | "USER_EDIT"
  | "USER_ACTIVATE"
  | "USER_ASSIGN"
  | "CUSTOMER_VIEW"
  | "CUSTOMER_CREATE"
  | "CUSTOMER_EDIT"
  | "CONTACT_VIEW"
  | "CONTACT_CREATE"
  | "CONTACT_EDIT"
  | "DEAL_VIEW"
  | "DEAL_CREATE"
  | "DEAL_EDIT"
  | "DEAL_DELETE"
  | "PIPELINE_VIEW"
  | "PIPELINE_EDIT"
  | "EMAIL_VIEW"
  | "EMAIL_SEND"
  | "EMAIL_MANAGE"
  | "EMAIL_INTEGRATION_VIEW"
  | "EMAIL_INTEGRATION_MANAGE"
  | "EMAIL_SYNC_MANAGE"
  | "PURCHASE_ORDER_VIEW"
  | "PURCHASE_ORDER_CREATE"
  | "PURCHASE_ORDER_EDIT"
  | "PURCHASE_ORDER_APPROVE"
  | "FOLLOW_UP_VIEW"
  | "FOLLOW_UP_CREATE"
  | "FOLLOW_UP_EDIT"
  | "TEAM_REQUEST_CREATE"
  | "TEAM_REQUEST_APPROVE"
  | "TEAM_REQUEST_REJECT"
  | "REPORT_VIEW_OWN"
  | "REPORT_VIEW_TEAM"
  | "REPORT_VIEW_ORGANIZATION"
  | "TARGET_VIEW"
  | "TARGET_MANAGE"
  | "NOTIFICATION_VIEW"
  | "NOTIFICATION_MANAGE"
  | "SEARCH_ORGANIZATION"
  | "DATA_IMPORT"
  | "DATA_EXPORT"
  | "AUDIT_LOG_VIEW"
  | "AUTOMATION_VIEW"
  | "AUTOMATION_MANAGE"
  | "AUTOMATION_EXECUTE"
  | "AUTOMATION_APPROVE"
  | "AI_VIEW"
  | "AI_MANAGE"
  | "AI_EXECUTE"
  | "AI_APPROVE"
  | "DOCUMENT_VIEW"
  | "DOCUMENT_MANAGE"
  | "DOCUMENT_UPLOAD"
  | "DOCUMENT_PROCESS"
  | "DOCUMENT_APPROVE"
  | "DOCUMENT_DELETE"
  | "SYSTEM_HEALTH_VIEW"
  | "SYSTEM_HEALTH_MANAGE"
  | "BACKUP_VIEW"
  | "BACKUP_MANAGE"
  | "BACKUP_RESTORE"
  | "SETTINGS_VIEW"
  | "SETTINGS_MANAGE"
  | "PERMISSION_MANAGE";

export type RolePermissionMap = Record<PortalRole, Permission[]>;

export const PERMISSION_LABELS: Record<Permission, string> = {
  USER_VIEW: "View Users",
  USER_CREATE: "Create Users",
  USER_EDIT: "Edit Users",
  USER_ACTIVATE: "Activate / Deactivate Users",
  USER_ASSIGN: "Assign Users",
  CUSTOMER_VIEW: "View Customers",
  CUSTOMER_CREATE: "Create Customers",
  CUSTOMER_EDIT: "Edit Customers",
  CONTACT_VIEW: "View Contacts",
  CONTACT_CREATE: "Create Contacts",
  CONTACT_EDIT: "Edit Contacts",
  DEAL_VIEW: "View Deals",
  DEAL_CREATE: "Create Deals",
  DEAL_EDIT: "Edit Deals",
  DEAL_DELETE: "Delete Deals",
  PIPELINE_VIEW: "View Pipeline",
  PIPELINE_EDIT: "Edit Pipeline",
  EMAIL_VIEW: "View Email",
  EMAIL_SEND: "Send Email",
  EMAIL_MANAGE: "Manage Email",
  EMAIL_INTEGRATION_VIEW: "View Email Integrations",
  EMAIL_INTEGRATION_MANAGE: "Manage Email Integrations",
  EMAIL_SYNC_MANAGE: "Manage Email Sync",
  PURCHASE_ORDER_VIEW: "View Purchase Orders",
  PURCHASE_ORDER_CREATE: "Create Purchase Orders",
  PURCHASE_ORDER_EDIT: "Edit Purchase Orders",
  PURCHASE_ORDER_APPROVE: "Approve Purchase Orders",
  FOLLOW_UP_VIEW: "View Follow-ups",
  FOLLOW_UP_CREATE: "Create Follow-ups",
  FOLLOW_UP_EDIT: "Edit Follow-ups",
  TEAM_REQUEST_CREATE: "Create Team Requests",
  TEAM_REQUEST_APPROVE: "Approve Team Requests",
  TEAM_REQUEST_REJECT: "Reject Team Requests",
  REPORT_VIEW_OWN: "Own Reports",
  REPORT_VIEW_TEAM: "Team Reports",
  REPORT_VIEW_ORGANIZATION: "Organization Reports",
  TARGET_VIEW: "View Targets",
  TARGET_MANAGE: "Manage Targets",
  NOTIFICATION_VIEW: "View Notifications",
  NOTIFICATION_MANAGE: "Manage Notifications",
  SEARCH_ORGANIZATION: "Organization Search",
  DATA_IMPORT: "Import Data",
  DATA_EXPORT: "Export Data",
  AUDIT_LOG_VIEW: "View Audit Logs",
  AUTOMATION_VIEW: "View Automation",
  AUTOMATION_MANAGE: "Manage Automation",
  AUTOMATION_EXECUTE: "Execute Automation",
  AUTOMATION_APPROVE: "Approve Automation",
  AI_VIEW: "View AI Configuration",
  AI_MANAGE: "Manage AI Configuration",
  AI_EXECUTE: "Execute AI Capabilities",
  AI_APPROVE: "Approve AI Results",
  DOCUMENT_VIEW: "View Documents",
  DOCUMENT_MANAGE: "Manage Documents",
  DOCUMENT_UPLOAD: "Upload Documents",
  DOCUMENT_PROCESS: "Process Documents",
  DOCUMENT_APPROVE: "Approve Document Reviews",
  DOCUMENT_DELETE: "Delete Documents",
  SYSTEM_HEALTH_VIEW: "View System Health",
  SYSTEM_HEALTH_MANAGE: "Manage System Health",
  BACKUP_VIEW: "View Backups",
  BACKUP_MANAGE: "Manage Backups",
  BACKUP_RESTORE: "Simulate Backup Restore",
  SETTINGS_VIEW: "View Settings",
  SETTINGS_MANAGE: "Manage Settings",
  PERMISSION_MANAGE: "Manage Roles & Permissions",
};

export interface PermissionGroup {
  id: string;
  label: string;
  permissions: Permission[];
}

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    id: "users",
    label: "User Management",
    permissions: [
      "USER_VIEW",
      "USER_CREATE",
      "USER_EDIT",
      "USER_ACTIVATE",
      "USER_ASSIGN",
    ],
  },
  {
    id: "crm",
    label: "CRM",
    permissions: [
      "CUSTOMER_VIEW",
      "CUSTOMER_CREATE",
      "CUSTOMER_EDIT",
      "CONTACT_VIEW",
      "CONTACT_CREATE",
      "CONTACT_EDIT",
      "DEAL_VIEW",
      "DEAL_CREATE",
      "DEAL_EDIT",
      "DEAL_DELETE",
    ],
  },
  {
    id: "pipeline",
    label: "Pipeline",
    permissions: ["PIPELINE_VIEW", "PIPELINE_EDIT"],
  },
  {
    id: "email",
    label: "Email",
    permissions: [
      "EMAIL_VIEW",
      "EMAIL_SEND",
      "EMAIL_MANAGE",
      "EMAIL_INTEGRATION_VIEW",
      "EMAIL_INTEGRATION_MANAGE",
      "EMAIL_SYNC_MANAGE",
    ],
  },
  {
    id: "operations",
    label: "Operations",
    permissions: [
      "PURCHASE_ORDER_VIEW",
      "PURCHASE_ORDER_CREATE",
      "PURCHASE_ORDER_EDIT",
      "PURCHASE_ORDER_APPROVE",
      "FOLLOW_UP_VIEW",
      "FOLLOW_UP_CREATE",
      "FOLLOW_UP_EDIT",
    ],
  },
  {
    id: "team",
    label: "Team Requests",
    permissions: ["TEAM_REQUEST_CREATE", "TEAM_REQUEST_APPROVE", "TEAM_REQUEST_REJECT"],
  },
  {
    id: "reports",
    label: "Reports",
    permissions: ["REPORT_VIEW_OWN", "REPORT_VIEW_TEAM", "REPORT_VIEW_ORGANIZATION"],
  },
  {
    id: "targets",
    label: "Targets",
    permissions: ["TARGET_VIEW", "TARGET_MANAGE"],
  },
  {
    id: "notifications",
    label: "Notifications",
    permissions: ["NOTIFICATION_VIEW", "NOTIFICATION_MANAGE"],
  },
  {
    id: "search",
    label: "Search",
    permissions: ["SEARCH_ORGANIZATION"],
  },
  {
    id: "data",
    label: "Data Management",
    permissions: ["DATA_IMPORT", "DATA_EXPORT"],
  },
  {
    id: "audit",
    label: "Audit",
    permissions: ["AUDIT_LOG_VIEW"],
  },
  {
    id: "automation",
    label: "Automation",
    permissions: ["AUTOMATION_VIEW", "AUTOMATION_MANAGE", "AUTOMATION_EXECUTE", "AUTOMATION_APPROVE"],
  },
  {
    id: "ai",
    label: "AI",
    permissions: ["AI_VIEW", "AI_MANAGE", "AI_EXECUTE", "AI_APPROVE"],
  },
  {
    id: "documents",
    label: "Documents",
    permissions: [
      "DOCUMENT_VIEW",
      "DOCUMENT_MANAGE",
      "DOCUMENT_UPLOAD",
      "DOCUMENT_PROCESS",
      "DOCUMENT_APPROVE",
      "DOCUMENT_DELETE",
    ],
  },
  {
    id: "system",
    label: "System Operations",
    permissions: [
      "SYSTEM_HEALTH_VIEW",
      "SYSTEM_HEALTH_MANAGE",
      "BACKUP_VIEW",
      "BACKUP_MANAGE",
      "BACKUP_RESTORE",
    ],
  },
  {
    id: "settings",
    label: "Settings & Permissions",
    permissions: ["SETTINGS_VIEW", "SETTINGS_MANAGE", "PERMISSION_MANAGE"],
  },
];

const ALL_PERMISSIONS = PERMISSION_GROUPS.flatMap((group) => group.permissions);

const MANAGER_PERMISSIONS: Permission[] = [
  "CUSTOMER_VIEW",
  "CUSTOMER_CREATE",
  "CUSTOMER_EDIT",
  "CONTACT_VIEW",
  "CONTACT_CREATE",
  "CONTACT_EDIT",
  "DEAL_VIEW",
  "DEAL_CREATE",
  "DEAL_EDIT",
  "PIPELINE_VIEW",
  "PIPELINE_EDIT",
  "EMAIL_VIEW",
  "EMAIL_SEND",
  "PURCHASE_ORDER_VIEW",
  "PURCHASE_ORDER_CREATE",
  "PURCHASE_ORDER_EDIT",
  "FOLLOW_UP_VIEW",
  "FOLLOW_UP_CREATE",
  "FOLLOW_UP_EDIT",
  "TEAM_REQUEST_CREATE",
  "REPORT_VIEW_TEAM",
  "TARGET_VIEW",
  "NOTIFICATION_VIEW",
  "SEARCH_ORGANIZATION",
  "SETTINGS_VIEW",
  "AUTOMATION_VIEW",
  "AUTOMATION_APPROVE",
];

const SALESPERSON_PERMISSIONS: Permission[] = [
  "CUSTOMER_VIEW",
  "CUSTOMER_CREATE",
  "CUSTOMER_EDIT",
  "CONTACT_VIEW",
  "CONTACT_CREATE",
  "CONTACT_EDIT",
  "DEAL_VIEW",
  "DEAL_CREATE",
  "DEAL_EDIT",
  "PIPELINE_VIEW",
  "PIPELINE_EDIT",
  "EMAIL_VIEW",
  "EMAIL_SEND",
  "PURCHASE_ORDER_VIEW",
  "PURCHASE_ORDER_CREATE",
  "PURCHASE_ORDER_EDIT",
  "FOLLOW_UP_VIEW",
  "FOLLOW_UP_CREATE",
  "FOLLOW_UP_EDIT",
  "REPORT_VIEW_OWN",
  "TARGET_VIEW",
  "NOTIFICATION_VIEW",
  "SEARCH_ORGANIZATION",
  "SETTINGS_VIEW",
  "AUTOMATION_VIEW",
  "AUTOMATION_EXECUTE",
];

export const DEFAULT_ROLE_PERMISSIONS: RolePermissionMap = {
  admin: [...ALL_PERMISSIONS],
  sales_manager: MANAGER_PERMISSIONS,
  salesperson: SALESPERSON_PERMISSIONS,
};

/** Admin cannot remove these — prevents locking out permission management. */
export const PROTECTED_ADMIN_PERMISSIONS: Permission[] = [
  "USER_VIEW",
  "AUDIT_LOG_VIEW",
  "SETTINGS_MANAGE",
  "PERMISSION_MANAGE",
];

export function createDefaultRolePermissions(): RolePermissionMap {
  return {
    admin: [...DEFAULT_ROLE_PERMISSIONS.admin],
    sales_manager: [...DEFAULT_ROLE_PERMISSIONS.sales_manager],
    salesperson: [...DEFAULT_ROLE_PERMISSIONS.salesperson],
  };
}

export function isPortalRole(role: UserRole): role is PortalRole {
  return role === "admin" || role === "sales_manager" || role === "salesperson";
}

export function getRolePermissions(
  role: UserRole,
  overrides?: Partial<RolePermissionMap>
): Permission[] {
  if (!isPortalRole(role)) return [];
  return overrides?.[role] ?? DEFAULT_ROLE_PERMISSIONS[role];
}

export function hasPermission(
  role: UserRole,
  permission: Permission,
  overrides?: Partial<RolePermissionMap>
): boolean {
  return getRolePermissions(role, overrides).includes(permission);
}

export function hasAnyPermission(
  role: UserRole,
  permissions: Permission[],
  overrides?: Partial<RolePermissionMap>
): boolean {
  const granted = getRolePermissions(role, overrides);
  return permissions.some((permission) => granted.includes(permission));
}

export function hasAllPermissions(
  role: UserRole,
  permissions: Permission[],
  overrides?: Partial<RolePermissionMap>
): boolean {
  const granted = getRolePermissions(role, overrides);
  return permissions.every((permission) => granted.includes(permission));
}

export function canUser(
  user: User | undefined,
  permission: Permission,
  overrides?: Partial<RolePermissionMap>
): boolean {
  if (!user) return false;
  return hasPermission(user.role, permission, overrides);
}

export function enforceProtectedAdminPermissions(permissions: Permission[]): Permission[] {
  return [...new Set([...permissions, ...PROTECTED_ADMIN_PERMISSIONS])];
}

export function sortPermissions(permissions: Permission[]): Permission[] {
  const order = new Map(ALL_PERMISSIONS.map((permission, index) => [permission, index]));
  return [...permissions].sort((a, b) => (order.get(a) ?? 0) - (order.get(b) ?? 0));
}

/** @deprecated Use canUser(user, permission) — kept for non-React callers with role only. */
export function canAccessTeamPerformance(role: UserRole, overrides?: Partial<RolePermissionMap>) {
  return hasAnyPermission(role, ["REPORT_VIEW_TEAM", "REPORT_VIEW_ORGANIZATION"], overrides);
}

/** @deprecated Use canUser(user, "USER_CREATE") etc. */
export function canManageUsers(role: UserRole, overrides?: Partial<RolePermissionMap>) {
  return hasAnyPermission(
    role,
    ["USER_CREATE", "USER_EDIT", "USER_ACTIVATE", "USER_ASSIGN"],
    overrides
  );
}

/** @deprecated Use permission-based checks. */
export function canEdit(role: UserRole, overrides?: Partial<RolePermissionMap>) {
  if (role === "viewer") return false;
  return hasAnyPermission(
    role,
    [
      "CUSTOMER_EDIT",
      "CONTACT_EDIT",
      "DEAL_EDIT",
      "FOLLOW_UP_EDIT",
      "PURCHASE_ORDER_EDIT",
      "PIPELINE_EDIT",
      "AUTOMATION_MANAGE",
    ],
    overrides
  );
}
