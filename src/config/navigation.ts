import {
  BarChart3,
  Bell,
  Building,
  Building2,
  Contact,
  Database,
  FileText,
  Handshake,
  Inbox,
  Kanban,
  LayoutDashboard,
  Mail,
  Package,
  Settings,
  Shield,
  Sparkles,
  Target,
  Users,
  UsersRound,
  Workflow,
  ClipboardList,
  Clock,
  HeartPulse,
  HardDrive,
} from "lucide-react";
import type { Permission } from "@/lib/auth/permissions";
import type { NavGroup, NavItem, UserRole } from "@/types";

type ConfigNavItem = NavItem & {
  permissions?: Permission | Permission[];
};

type ConfigNavGroup = {
  label: string;
  items: ConfigNavItem[];
};

const adminNavigation: ConfigNavGroup[] = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
      { title: "Sales Team", href: "/sales-team", icon: "UsersRound", permissions: "USER_VIEW" },
      {
        title: "Team Requests",
        href: "/team-requests",
        icon: "ClipboardList",
        permissions: "TEAM_REQUEST_APPROVE",
      },
      { title: "Audit Logs", href: "/audit-logs", icon: "FileText", permissions: "AUDIT_LOG_VIEW" },
    ],
  },
  {
    label: "Sales",
    items: [
      { title: "Customers", href: "/customers", icon: "Building2", permissions: "CUSTOMER_VIEW" },
      { title: "Contacts", href: "/contacts", icon: "Contact", permissions: "CONTACT_VIEW" },
      { title: "Deals", href: "/deals", icon: "Handshake", permissions: "DEAL_VIEW" },
      { title: "Pipeline", href: "/pipeline", icon: "Kanban", permissions: "PIPELINE_VIEW" },
    ],
  },
  {
    label: "Operations",
    items: [
      {
        title: "Purchase Orders",
        href: "/purchase-orders",
        icon: "Package",
        permissions: "PURCHASE_ORDER_VIEW",
      },
      { title: "Follow-ups", href: "/follow-ups", icon: "Clock", permissions: "FOLLOW_UP_VIEW" },
    ],
  },
  {
    label: "Communication",
    items: [
      { title: "Inbox", href: "/inbox", icon: "Inbox", permissions: "EMAIL_VIEW" },
      {
        title: "Email Integrations",
        href: "/email-integrations",
        icon: "Mail",
        permissions: ["EMAIL_INTEGRATION_VIEW", "EMAIL_INTEGRATION_MANAGE"],
      },
    ],
  },
  {
    label: "Automation",
    items: [{ title: "Automation", href: "/automation", icon: "Workflow", permissions: "AUTOMATION_VIEW" }],
  },
  {
    label: "AI",
    items: [
      {
        title: "AI Configuration",
        href: "/ai",
        icon: "Sparkles",
        permissions: ["AI_VIEW", "AI_MANAGE"],
      },
    ],
  },
  {
    label: "Analytics",
    items: [
      { title: "Reports", href: "/reports", icon: "BarChart3", permissions: "REPORT_VIEW_ORGANIZATION" },
      { title: "Targets", href: "/targets", icon: "Target", permissions: "TARGET_MANAGE" },
    ],
  },
  {
    label: "Admin",
    items: [
      { title: "Users", href: "/users", icon: "Users", permissions: "USER_VIEW" },
      {
        title: "Roles & Permissions",
        href: "/permissions",
        icon: "Shield",
        permissions: "PERMISSION_MANAGE",
      },
      {
        title: "Organization Settings",
        href: "/organization-settings",
        icon: "Building",
        permissions: "SETTINGS_MANAGE",
      },
      {
        title: "Notifications",
        href: "/notifications",
        icon: "Bell",
        permissions: "NOTIFICATION_VIEW",
      },
      {
        title: "Data Management",
        href: "/data-management",
        icon: "Database",
        permissions: ["DATA_IMPORT", "DATA_EXPORT"],
      },
      {
        title: "Documents",
        href: "/data-management/documents",
        icon: "FileText",
        permissions: ["DOCUMENT_VIEW", "DOCUMENT_MANAGE"],
      },
      {
        title: "System Health",
        href: "/system-health",
        icon: "HeartPulse",
        permissions: ["SYSTEM_HEALTH_VIEW"],
      },
      {
        title: "Backup & Recovery",
        href: "/backup-recovery",
        icon: "HardDrive",
        permissions: ["BACKUP_VIEW"],
      },
      { title: "Settings", href: "/settings", icon: "Settings", permissions: "SETTINGS_VIEW" },
    ],
  },
];

const managerNavigation: ConfigNavGroup[] = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
      { title: "My Team", href: "/my-team", icon: "UsersRound" },
    ],
  },
  {
    label: "Sales",
    items: [
      { title: "Customers", href: "/customers", icon: "Building2", permissions: "CUSTOMER_VIEW" },
      { title: "Contacts", href: "/contacts", icon: "Contact", permissions: "CONTACT_VIEW" },
      { title: "Deals", href: "/deals", icon: "Handshake", permissions: "DEAL_VIEW" },
      { title: "Pipeline", href: "/pipeline", icon: "Kanban", permissions: "PIPELINE_VIEW" },
    ],
  },
  {
    label: "Communication",
    items: [{ title: "Inbox", href: "/inbox", icon: "Inbox", permissions: "EMAIL_VIEW" }],
  },
  {
    label: "Automation",
    items: [{ title: "Automation", href: "/automation", icon: "Workflow", permissions: "AUTOMATION_VIEW" }],
  },
  {
    label: "Operations",
    items: [
      {
        title: "Purchase Orders",
        href: "/purchase-orders",
        icon: "Package",
        permissions: "PURCHASE_ORDER_VIEW",
      },
      { title: "Follow-ups", href: "/follow-ups", icon: "Clock", permissions: "FOLLOW_UP_VIEW" },
    ],
  },
  {
    label: "Analytics",
    items: [
      { title: "Team Reports", href: "/reports", icon: "BarChart3", permissions: "REPORT_VIEW_TEAM" },
      { title: "Team Targets", href: "/targets", icon: "Target", permissions: "TARGET_VIEW" },
    ],
  },
  {
    label: "Account",
    items: [
      { title: "Notifications", href: "/notifications", icon: "Bell", permissions: "NOTIFICATION_VIEW" },
      { title: "Settings", href: "/settings", icon: "Settings", permissions: "SETTINGS_VIEW" },
    ],
  },
];

const salespersonNavigation: ConfigNavGroup[] = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
      { title: "My Performance", href: "/my-performance", icon: "BarChart3" },
    ],
  },
  {
    label: "Sales",
    items: [
      { title: "My Customers", href: "/customers", icon: "Building2", permissions: "CUSTOMER_VIEW" },
      { title: "My Contacts", href: "/contacts", icon: "Contact", permissions: "CONTACT_VIEW" },
      { title: "My Deals", href: "/deals", icon: "Handshake", permissions: "DEAL_VIEW" },
      { title: "My Pipeline", href: "/pipeline", icon: "Kanban", permissions: "PIPELINE_VIEW" },
    ],
  },
  {
    label: "Communication",
    items: [
      { title: "My Inbox", href: "/inbox", icon: "Inbox", permissions: "EMAIL_VIEW" },
      { title: "Notifications", href: "/notifications", icon: "Bell", permissions: "NOTIFICATION_VIEW" },
    ],
  },
  {
    label: "Automation",
    items: [
      {
        title: "My Automation",
        href: "/automation",
        icon: "Workflow",
        permissions: "AUTOMATION_VIEW",
      },
    ],
  },
  {
    label: "Operations",
    items: [
      {
        title: "My Purchase Orders",
        href: "/purchase-orders",
        icon: "Package",
        permissions: "PURCHASE_ORDER_VIEW",
      },
      { title: "My Follow-ups", href: "/follow-ups", icon: "Clock", permissions: "FOLLOW_UP_VIEW" },
    ],
  },
  {
    label: "Analytics",
    items: [
      { title: "My Reports", href: "/reports", icon: "BarChart3", permissions: "REPORT_VIEW_OWN" },
      { title: "My Targets", href: "/targets", icon: "Target", permissions: "TARGET_VIEW" },
    ],
  },
  {
    label: "Account",
    items: [{ title: "Settings", href: "/settings", icon: "Settings", permissions: "SETTINGS_VIEW" }],
  },
];

function isNavItemAllowed(item: ConfigNavItem, can: (permission: Permission) => boolean) {
  if (!item.permissions) return true;
  const permissions = Array.isArray(item.permissions) ? item.permissions : [item.permissions];
  return permissions.every((permission) => can(permission));
}

function filterNavigationGroups(
  groups: ConfigNavGroup[],
  can: (permission: Permission) => boolean
): NavGroup[] {
  return groups
    .map((group) => ({
      label: group.label,
      items: group.items
        .filter((item) => isNavItemAllowed(item, can))
        .map(({ permissions: _permissions, ...item }) => item),
    }))
    .filter((group) => group.items.length > 0);
}

export function getNavigationGroups(
  role: UserRole,
  can: (permission: Permission) => boolean = () => true
): NavGroup[] {
  const groups =
    role === "admin"
      ? adminNavigation
      : role === "sales_manager"
        ? managerNavigation
        : salespersonNavigation;
  return filterNavigationGroups(groups, can);
}

/** @deprecated Use getNavigationGroups(role). Kept as the admin map for existing imports. */
export const navigationGroups: NavGroup[] = filterNavigationGroups(adminNavigation, () => true);

export const iconMap = {
  LayoutDashboard,
  Building,
  Building2,
  Contact,
  Handshake,
  Kanban,
  Package,
  Clock,
  Inbox,
  Mail,
  FileText,
  Workflow,
  BarChart3,
  Bell,
  Target,
  Database,
  Users,
  UsersRound,
  ClipboardList,
  Settings,
  Shield,
  Sparkles,
  HeartPulse,
  HardDrive,
} as const;

export type IconName = keyof typeof iconMap;
