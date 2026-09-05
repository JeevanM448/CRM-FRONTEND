import type { UserRole } from "@/types";
import type { Permission } from "@/lib/auth/permissions";

/**
 * Frontend/UX route access only. Not production authorization.
 * Real access control will use Supabase Auth + server checks + RLS.
 */
const MANAGER_PATHS = [
  "/dashboard",
  "/team",
  "/my-team",
  "/customers",
  "/contacts",
  "/deals",
  "/pipeline",
  "/inbox",
  "/purchase-orders",
  "/follow-ups",
  "/reports",
  "/targets",
  "/notifications",
  "/automation",
  "/settings",
  "/search",
] as const;

const SALESPERSON_PATHS = [
  "/dashboard",
  "/my-performance",
  "/customers",
  "/contacts",
  "/deals",
  "/pipeline",
  "/inbox",
  "/purchase-orders",
  "/follow-ups",
  "/notifications",
  "/search",
  "/reports",
  "/targets",
  "/automation",
  "/settings",
] as const;

function matchesPath(pathname: string, allowed: readonly string[]) {
  return allowed.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

function getReportsPermission(role: UserRole): Permission {
  if (role === "admin") return "REPORT_VIEW_ORGANIZATION";
  if (role === "sales_manager") return "REPORT_VIEW_TEAM";
  return "REPORT_VIEW_OWN";
}

function getPathViewPermission(pathname: string, role: UserRole): Permission | undefined {
  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) return undefined;
  if (pathname === "/customers" || pathname.startsWith("/customers/")) return "CUSTOMER_VIEW";
  if (pathname === "/contacts" || pathname.startsWith("/contacts/")) return "CONTACT_VIEW";
  if (pathname === "/deals" || pathname.startsWith("/deals/")) return "DEAL_VIEW";
  if (pathname === "/pipeline" || pathname.startsWith("/pipeline/")) return "PIPELINE_VIEW";
  if (pathname === "/inbox" || pathname.startsWith("/inbox/")) return "EMAIL_VIEW";
  if (pathname === "/purchase-orders" || pathname.startsWith("/purchase-orders/")) {
    return "PURCHASE_ORDER_VIEW";
  }
  if (pathname === "/follow-ups" || pathname.startsWith("/follow-ups/")) return "FOLLOW_UP_VIEW";
  if (pathname === "/reports" || pathname.startsWith("/reports/")) return getReportsPermission(role);
  if (pathname === "/settings" || pathname.startsWith("/settings/")) return "SETTINGS_VIEW";
  return undefined;
}

export function canAccessPath(
  role: UserRole,
  pathname: string,
  checkPermission: (permission: Permission) => boolean = () => true
): boolean {
  if (pathname === "/my-team" || pathname.startsWith("/my-team/")) {
    return role === "sales_manager";
  }
  if (pathname === "/my-performance" || pathname.startsWith("/my-performance/")) {
    return role === "salesperson" && checkPermission("REPORT_VIEW_OWN");
  }
  if (pathname === "/sales-team" || pathname.startsWith("/sales-team/")) {
    return role === "admin" && checkPermission("USER_VIEW");
  }
  if (pathname === "/team-requests" || pathname.startsWith("/team-requests/")) {
    return role === "admin" && checkPermission("TEAM_REQUEST_APPROVE");
  }
  if (pathname === "/audit-logs" || pathname.startsWith("/audit-logs/")) {
    return role === "admin" && checkPermission("AUDIT_LOG_VIEW");
  }
  if (pathname === "/permissions" || pathname.startsWith("/permissions/")) {
    return role === "admin" && checkPermission("PERMISSION_MANAGE");
  }
  if (pathname === "/organization-settings" || pathname.startsWith("/organization-settings/")) {
    return role === "admin" && checkPermission("SETTINGS_MANAGE");
  }
  if (pathname === "/users" || pathname.startsWith("/users/")) {
    return role === "admin" && checkPermission("USER_VIEW");
  }
  if (pathname === "/automation" || pathname.startsWith("/automation/")) {
    return checkPermission("AUTOMATION_VIEW");
  }
  if (pathname === "/ai" || pathname.startsWith("/ai/")) {
    return role === "admin" && checkPermission("AI_VIEW") && checkPermission("AI_MANAGE");
  }
  if (pathname === "/data-management/documents" || pathname.startsWith("/data-management/documents/")) {
    return role === "admin" && checkPermission("DOCUMENT_VIEW") && checkPermission("DOCUMENT_MANAGE");
  }
  if (pathname === "/system-health" || pathname.startsWith("/system-health/")) {
    return role === "admin" && checkPermission("SYSTEM_HEALTH_VIEW");
  }
  if (pathname === "/backup-recovery" || pathname.startsWith("/backup-recovery/")) {
    return role === "admin" && checkPermission("BACKUP_VIEW");
  }
  if (pathname === "/targets" || pathname.startsWith("/targets/")) {
    if (role === "admin") return checkPermission("TARGET_MANAGE");
    return checkPermission("TARGET_VIEW");
  }
  if (pathname === "/notifications" || pathname.startsWith("/notifications/")) {
    return checkPermission("NOTIFICATION_VIEW");
  }
  if (pathname === "/data-management" || pathname.startsWith("/data-management/")) {
    return (
      role === "admin" &&
      checkPermission("DATA_IMPORT") &&
      checkPermission("DATA_EXPORT")
    );
  }
  if (pathname === "/search" || pathname.startsWith("/search/")) {
    return checkPermission("SEARCH_ORGANIZATION");
  }
  if (pathname === "/email-integrations" || pathname.startsWith("/email-integrations/")) {
    return (
      role === "admin" &&
      checkPermission("EMAIL_INTEGRATION_VIEW") &&
      checkPermission("EMAIL_INTEGRATION_MANAGE")
    );
  }

  let inAllowlist = false;
  if (role === "admin") inAllowlist = true;
  else if (role === "sales_manager") inAllowlist = matchesPath(pathname, MANAGER_PATHS);
  else inAllowlist = matchesPath(pathname, SALESPERSON_PATHS);

  if (!inAllowlist) return false;

  const viewPermission = getPathViewPermission(pathname, role);
  if (viewPermission && !checkPermission(viewPermission)) return false;

  return true;
}
