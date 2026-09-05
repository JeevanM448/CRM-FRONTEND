"use client";

import { createContext, useContext, useEffect, useSyncExternalStore, useCallback, useMemo } from "react";
import type { Permission } from "@/lib/auth/permissions";
import { setFormattingContext } from "@/lib/formatting-context";
import { canEdit as roleCanEdit, canManageUsers as roleCanManageUsers, canAccessTeamPerformance } from "@/lib/auth/permissions";
import * as store from "./crmStore";
import { initStore } from "./crmStore";

const CRMStoreContext = createContext<typeof store | null>(null);

export function CRMStoreProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initStore();
  }, []);

  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);

  useEffect(() => {
    const org = snapshot.organization.settings;
    setFormattingContext({
      currency: org.currency,
      dateFormat: org.dateFormat,
      timezone: org.timezone,
    });
  }, [snapshot.organization.settings]);

  return (
    <CRMStoreContext.Provider value={store}>{children}</CRMStoreContext.Provider>
  );
}

export function useCRMStore() {
  const ctx = useContext(CRMStoreContext);
  if (!ctx) throw new Error("useCRMStore must be used within CRMStoreProvider");
  useSyncExternalStore(ctx.subscribe, ctx.getSnapshot, ctx.getSnapshot);
  return ctx;
}

export function useCRMState() {
  const ctx = useCRMStore();
  return ctx.getSnapshot();
}

/** Mock session identity: id, name, and UserRole live on the current CRM user. */
export function useCurrentUser() {
  const ctx = useCRMStore();
  return ctx.getCurrentUser();
}

export function useDashboardMetrics() {
  const ctx = useCRMStore();
  return ctx.getDashboardMetrics();
}

export function usePermissions() {
  const user = useCurrentUser();
  const { userHasPermission, userHasAnyPermission, getRolePermissionsState } = useCRMStore();
  const role = user?.role ?? "viewer";
  const overrides = getRolePermissionsState();

  const can = useCallback(
    (permission: Permission) => userHasPermission(user, permission),
    [user, userHasPermission]
  );

  const canAny = useCallback(
    (permissions: Permission[]) => userHasAnyPermission(user, permissions),
    [user, userHasAnyPermission]
  );

  return useMemo(
    () => ({
      user,
      role,
      can,
      canAny,
      canEdit: roleCanEdit(role, overrides),
      canManageUsers: roleCanManageUsers(role, overrides),
      canCreateUsers: can("USER_CREATE"),
      canEditUsers: can("USER_EDIT"),
      canActivateUsers: can("USER_ACTIVATE"),
      canAssignUsers: can("USER_ASSIGN"),
      canReviewTeamRequests: canAny(["TEAM_REQUEST_APPROVE", "TEAM_REQUEST_REJECT"]),
      canViewAuditLogs: can("AUDIT_LOG_VIEW"),
      canManagePermissions: can("PERMISSION_MANAGE"),
      canManageOrganization: can("SETTINGS_MANAGE"),
      canAccessTeamPerformance: canAccessTeamPerformance(role, overrides),
      canRequestTeamMembers: can("TEAM_REQUEST_CREATE"),
      canManageTargets: can("TARGET_MANAGE"),
      canViewTargets: can("TARGET_VIEW"),
      canViewNotifications: can("NOTIFICATION_VIEW"),
      canSearchOrganization: can("SEARCH_ORGANIZATION"),
      canImportData: can("DATA_IMPORT"),
      canExportData: can("DATA_EXPORT"),
      canViewEmailIntegrations: can("EMAIL_INTEGRATION_VIEW"),
      canManageEmailIntegrations: can("EMAIL_INTEGRATION_MANAGE"),
      canManageEmailSync: can("EMAIL_SYNC_MANAGE"),
      canViewAutomation: can("AUTOMATION_VIEW"),
      canManageAutomation: can("AUTOMATION_MANAGE"),
      canExecuteAutomation: can("AUTOMATION_EXECUTE"),
      canApproveAutomation: can("AUTOMATION_APPROVE"),
      canViewAI: can("AI_VIEW"),
      canManageAI: can("AI_MANAGE"),
      canExecuteAI: can("AI_EXECUTE"),
      canApproveAI: can("AI_APPROVE"),
      canViewDocuments: can("DOCUMENT_VIEW"),
      canManageDocuments: can("DOCUMENT_MANAGE"),
      canUploadDocuments: can("DOCUMENT_UPLOAD"),
      canProcessDocuments: can("DOCUMENT_PROCESS"),
      canApproveDocuments: can("DOCUMENT_APPROVE"),
      canDeleteDocuments: can("DOCUMENT_DELETE"),
      canViewSystemHealth: can("SYSTEM_HEALTH_VIEW"),
      canManageSystemHealth: can("SYSTEM_HEALTH_MANAGE"),
      canViewBackups: can("BACKUP_VIEW"),
      canManageBackups: can("BACKUP_MANAGE"),
      canRestoreBackups: can("BACKUP_RESTORE"),
      canDeleteDeals: can("DEAL_DELETE"),
      canApprovePurchaseOrders: can("PURCHASE_ORDER_APPROVE"),
      isReadOnly: role === "viewer",
    }),
    [user, role, can, canAny, overrides]
  );
}
