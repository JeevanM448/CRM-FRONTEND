import {
  enforceProtectedAdminPermissions,
  getRolePermissions,
  hasAllPermissions,
  hasAnyPermission,
  hasPermission,
  isPortalRole,
  sortPermissions,
  type Permission,
  type PortalRole,
  type RolePermissionMap,
} from "@/lib/auth/permissions";
import { createOrganizationStore } from "./crmStoreOrganization";
import { clearMockLogoBlobs } from "./organizationLogo";
import { createTargetStore } from "./crmStoreTargets";
import { createNotificationStore } from "./crmStoreNotifications";
import { createEmailIntegrationStore } from "./crmStoreEmailIntegrations";
import { createAutomationStore } from "./crmStoreAutomation";
import { createAIStore } from "./crmStoreAI";
import { createDocumentsStore } from "./crmStoreDocuments";
import { createSystemHealthStore } from "./crmStoreSystemHealth";
import { createBackupsStore } from "./crmStoreBackups";
import { normalizeWorkflow } from "./automation";
import { createDataManagementStore } from "./crmStoreDataManagement";
import { createSeedState } from "@/data/mock/seed";
import type {
  Activity,
  Contact,
  Customer,
  Deal,
  DealStage,
  EmailThread,
  FollowUp,
  FollowUpStatus,
  PurchaseOrder,
  User,
} from "@/types";
import {
  clearAllStorage,
  exportAllStorage,
  generateId,
  isBrowser,
  loadFromStorage,
  saveToStorage,
  STORAGE_KEYS,
  STORAGE_VERSION,
} from "./storage";
import type { AppNotification, AppSettings, AuditLog, CRMState } from "./types";
import {
  calculateDashboardMetrics,
  computeFollowUpStatus,
  enrichCustomer,
  enrichDeal,
  getAttentionDeals,
  getPipelineData,
  getUserById,
  globalSearch,
  groupSearchResults,
  type ComposeEmailInput,
  type CreateContactInput,
  type CreateCustomerInput,
  type CreateDealInput,
  type CreateFollowUpInput,
  type CreatePOInput,
  type CreateUserInput,
  type SearchResult,
} from "./helpers";
import {
  getSalesTeamOverview as buildSalesTeamOverview,
  getSalesTeamRows as buildSalesTeamRows,
  getSalespersonDetail as buildSalespersonDetail,
  getMyTeamOverview as buildMyTeamOverview,
  getMyTeamRows as buildMyTeamRows,
  getManagerRows as buildManagerRows,
  getManagerDetail as buildManagerDetail,
} from "./salesTeam";
import { getManagerDashboardData as buildManagerDashboardData } from "./managerDashboard";
import { getTeamMember360Data as buildTeamMember360Data } from "./teamMember360";
import {
  getTeamCustomers as buildTeamCustomers,
  getTeamCustomerOwners as buildTeamCustomerOwners,
  getTeamCustomersSummary as buildTeamCustomersSummary,
  getCustomerAccessStatus as buildCustomerAccessStatus,
  canViewCustomer,
} from "./teamCustomers";
import {
  getTeamContacts as buildTeamContacts,
  getTeamContactOwners as buildTeamContactOwners,
  getTeamContactsSummary as buildTeamContactsSummary,
  getContactAccessStatus as buildContactAccessStatus,
  canViewContact,
} from "./teamContacts";
import {
  getTeamDeals as buildTeamDeals,
  getTeamDealOwners as buildTeamDealOwners,
  getTeamDealsSummary as buildTeamDealsSummary,
  getDealAccessStatus as buildDealAccessStatus,
  canViewDeal,
} from "./teamDeals";
import { getTeamPipelineSummary as buildTeamPipelineSummary } from "./teamPipeline";
import {
  getTeamInboxSummary as buildTeamInboxSummary,
  getEmailAccessStatus as buildEmailAccessStatus,
  canViewEmail,
} from "./teamInbox";
import {
  getTeamPurchaseOrders as buildTeamPurchaseOrders,
  getTeamPOOwners as buildTeamPOOwners,
  getTeamPurchaseOrdersSummary as buildTeamPurchaseOrdersSummary,
  getPurchaseOrderAccessStatus as buildPurchaseOrderAccessStatus,
  canViewPurchaseOrder,
} from "./teamPurchaseOrders";
import {
  getTeamFollowUps as buildTeamFollowUps,
  getTeamFollowUpOwners as buildTeamFollowUpOwners,
  getTeamFollowUpsSummary as buildTeamFollowUpsSummary,
  getFollowUpAccessStatus as buildFollowUpAccessStatus,
} from "./teamFollowUps";
import {
  getManagerTeamTargetRows as buildManagerTeamTargetRows,
  getManagerTeamTargetSummary as buildManagerTeamTargetSummary,
} from "./teamTargets";
import {
  getSalespersonOwnTargetRows as buildSalespersonOwnTargetRows,
  getSalespersonOwnTargetSummary as buildSalespersonOwnTargetSummary,
} from "./salespersonTargets";
import { DEFAULT_ORGANIZATION_ID } from "@/types/account";
import {
  accountCanSignIn,
  createUserAccountRecord,
  getAccountByEmail,
  getAccountByUserId,
  getAccountRoleLabel,
  isAccountRole,
  isSignInEmailAvailable,
  normalizeSignInEmail,
} from "./accounts";
import { mockHashPassword, verifyMockPassword } from "./mockCredentials";
import {
  getAutomationExecutionsForUser as buildAutomationExecutionsForUser,
  getAutomationExecutionAccessStatus as buildAutomationExecutionAccessStatus,
  getTeamAutomationSummary as buildTeamAutomationSummary,
  getPendingApprovalsForManager as buildPendingApprovalsForManager,
  canViewAutomationExecution,
} from "./teamAutomation";
import {
  appendAuditLogs,
  IMPORTANT_AUDIT_ACTIONS,
  toAuditLogView,
  type CreateAuditLogInput,
} from "./auditLogs";
import { applyScope, canSeeOwner, canViewManagedMember, getDataScope } from "./scope";
import {
  filterRequestsForManager,
  getTeamRequestEligibility,
  hasPendingTeamRequest,
  searchSalespeopleForTeamRequest as searchTeamRequestCandidates,
  TEAM_REQUEST_MESSAGES,
  toTeamRequestView,
} from "./teamRequests";
import { createNotification, normalizeNotification } from "./notifications";
import { getDefaultTargetPeriod, normalizeSalesTarget } from "./targets";
import type { TeamRequest, TeamRequestType } from "./types";

function normalizeLoadedWorkflows(workflows: CRMState["workflows"]) {
  return workflows.map((workflow) => normalizeWorkflow(workflow));
}

function normalizeLoadedSalesTargets(targets: CRMState["salesTargets"]) {
  return targets.map((target) => normalizeSalesTarget(target));
}

function normalizeLoadedNotifications(notifications: CRMState["notifications"]) {
  return notifications.map((notification) => normalizeNotification(notification));
}

let state: CRMState = createSeedState();
let initialized = false;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

function persist(current: CRMState) {
  if (!isBrowser()) return;
  saveToStorage(STORAGE_KEYS.version, STORAGE_VERSION);
  saveToStorage(STORAGE_KEYS.customers, current.customers);
  saveToStorage(STORAGE_KEYS.contacts, current.contacts);
  saveToStorage(STORAGE_KEYS.deals, current.deals);
  saveToStorage(STORAGE_KEYS.emails, current.emails);
  saveToStorage(STORAGE_KEYS.purchaseOrders, current.purchaseOrders);
  saveToStorage(STORAGE_KEYS.followUps, current.followUps);
  saveToStorage(STORAGE_KEYS.workflows, current.workflows);
  saveToStorage(STORAGE_KEYS.automationExecutions, current.automationExecutions);
  saveToStorage(STORAGE_KEYS.aiConfiguration, current.aiConfiguration);
  saveToStorage(STORAGE_KEYS.aiCapabilities, current.aiCapabilities);
  saveToStorage(STORAGE_KEYS.aiExecutions, current.aiExecutions);
  saveToStorage(STORAGE_KEYS.documents, current.documents);
  saveToStorage(STORAGE_KEYS.documentVersions, current.documentVersions);
  saveToStorage(STORAGE_KEYS.documentProcessing, current.documentProcessing);
  saveToStorage(STORAGE_KEYS.healthServices, current.healthServices);
  saveToStorage(STORAGE_KEYS.healthCheckHistory, current.healthCheckHistory);
  saveToStorage(STORAGE_KEYS.systemIncidents, current.systemIncidents);
  saveToStorage(STORAGE_KEYS.backups, current.backups);
  saveToStorage(STORAGE_KEYS.recoveryPoints, current.recoveryPoints);
  saveToStorage(STORAGE_KEYS.backupRetentionPolicy, current.backupRetentionPolicy);
  saveToStorage(STORAGE_KEYS.users, current.users);
  saveToStorage(STORAGE_KEYS.userAccounts, current.userAccounts);
  saveToStorage(STORAGE_KEYS.notifications, current.notifications);
  saveToStorage(STORAGE_KEYS.activities, current.activities);
  saveToStorage(STORAGE_KEYS.salesTargets, current.salesTargets);
  saveToStorage(STORAGE_KEYS.targetHistory, current.targetHistory);
  saveToStorage(STORAGE_KEYS.teamRequests, current.teamRequests);
  saveToStorage(STORAGE_KEYS.auditLogs, current.auditLogs);
  saveToStorage(STORAGE_KEYS.emailIntegrations, current.emailIntegrations);
  saveToStorage(STORAGE_KEYS.emailSyncRuns, current.emailSyncRuns);
  saveToStorage(STORAGE_KEYS.rolePermissions, current.rolePermissions);
  saveToStorage(STORAGE_KEYS.organization, current.organization);
  saveToStorage(STORAGE_KEYS.settings, current.settings);
  saveToStorage(STORAGE_KEYS.currentUserId, current.currentUserId);
}

function setState(updater: (prev: CRMState) => CRMState) {
  state = updater(state);
  persist(state);
  notify();
}

function addActivity(
  current: CRMState,
  activity: Omit<Activity, "id" | "timestamp"> & { timestamp?: string }
): Activity[] {
  const newActivity: Activity = {
    id: generateId("act"),
    timestamp: activity.timestamp ?? new Date().toISOString(),
    type: activity.type,
    title: activity.title,
    description: activity.description,
    entityType: activity.entityType,
    entityId: activity.entityId,
    customerId: activity.customerId,
    dealId: activity.dealId,
    actorId: activity.actorId ?? current.currentUserId,
  };
  return [newActivity, ...current.activities].slice(0, 100);
}

function withAuditEntries(s: CRMState, entries: CreateAuditLogInput[]): CRMState {
  if (entries.length === 0) return s;
  return { ...s, auditLogs: appendAuditLogs(s, entries) };
}

function buildUserUpdateAudits(
  existing: User,
  data: Partial<CreateUserInput>,
  assignedManagerId: string | undefined,
  managerAssignmentSpecified: boolean,
  manager: User | undefined,
  targetAmount: number | undefined,
  previousTargetAmount: number | undefined,
  targetRecordId: string | undefined
): CreateAuditLogInput[] {
  const entries: CreateAuditLogInput[] = [];

  if (data.status && data.status !== existing.status) {
    entries.push({
      action: data.status === "active" ? "activated" : "deactivated",
      entityType: "user",
      entityId: existing.id,
      previousValue: { status: existing.status },
      newValue: { status: data.status },
      metadata: { name: existing.name },
    });
  }

  if (managerAssignmentSpecified && existing.managerId !== assignedManagerId) {
    entries.push({
      action: assignedManagerId ? "assigned" : "unassigned",
      entityType: "user",
      entityId: existing.id,
      previousValue: { managerId: existing.managerId, team: existing.team },
      newValue: { managerId: assignedManagerId, team: manager?.team },
      metadata: { managerName: manager?.name, name: existing.name },
    });
  }

  if (targetAmount != null && targetAmount !== previousTargetAmount) {
    entries.push({
      action: "updated",
      entityType: "sales_target",
      entityId: targetRecordId ?? existing.id,
      previousValue: { targetAmount: previousTargetAmount ?? 0, userId: existing.id },
      newValue: { targetAmount, userId: existing.id },
      metadata: { name: existing.name, period: "2026-Q3" },
    });
  }

  const profileKeys = ["name", "email", "phone", "role", "department", "team"] as const;
  const profileChanged = profileKeys.some((key) => {
    if (key === "team" && managerAssignmentSpecified) return false;
    const nextValue = data[key];
    if (nextValue === undefined) return false;
    if (key === "team") return String(nextValue).trim() !== (existing.team ?? "");
    if (key === "phone") return (nextValue as string).trim() !== (existing.phone ?? "");
    return nextValue !== existing[key];
  });

  if (profileChanged) {
    entries.push({
      action: "updated",
      entityType: "user",
      entityId: existing.id,
      previousValue: {
        name: existing.name,
        email: existing.email,
        phone: existing.phone,
        team: existing.team,
        role: existing.role,
      },
      newValue: {
        name: data.name ?? existing.name,
        email: data.email ?? existing.email,
        phone: data.phone ?? existing.phone,
        team: managerAssignmentSpecified ? manager?.team ?? existing.team : data.team ?? existing.team,
        role: data.role ?? existing.role,
      },
      metadata: { name: existing.name },
    });
  }

  return entries;
}

function addNotification(
  current: CRMState,
  notification: Omit<AppNotification, "id" | "timestamp" | "read" | "severity"> & {
    severity?: AppNotification["severity"];
  }
): AppNotification[] {
  return createNotification(current.notifications, notification);
}

function refreshFollowUpStatuses(followUps: FollowUp[]): FollowUp[] {
  return followUps.map((f) => ({
    ...f,
    status: computeFollowUpStatus(f.dueDate, f.status),
  }));
}

function touchCustomerLastActivity(customers: Customer[], customerId?: string): Customer[] {
  if (!customerId) return customers;
  const ts = new Date().toISOString();
  return customers.map((c) => (c.id === customerId ? { ...c, lastActivity: ts } : c));
}

function touchDealLastActivity(deals: Deal[], dealId?: string): Deal[] {
  if (!dealId) return deals;
  const ts = new Date().toISOString();
  return deals.map((d) => (d.id === dealId ? { ...d, lastActivity: ts } : d));
}

function recalculateSalesTargets(current: CRMState) {
  return current.salesTargets.map((target) => ({
    ...target,
    achievedAmount: current.deals
      .filter((d) => d.ownerId === target.userId && d.stage === "won")
      .reduce((sum, d) => sum + d.value, 0),
  }));
}

export function initStore() {
  if (initialized) return;
  initialized = true;

  if (!isBrowser()) {
    state = createSeedState();
    return;
  }

  const version = loadFromStorage<number | null>(STORAGE_KEYS.version, null);
  if (version !== STORAGE_VERSION) {
    state = createSeedState();
    persist(state);
    return;
  }

  const seed = createSeedState();
  state = {
    customers: loadFromStorage(STORAGE_KEYS.customers, seed.customers),
    contacts: loadFromStorage(STORAGE_KEYS.contacts, seed.contacts),
    deals: loadFromStorage(STORAGE_KEYS.deals, seed.deals),
    emails: loadFromStorage(STORAGE_KEYS.emails, seed.emails),
    purchaseOrders: loadFromStorage(STORAGE_KEYS.purchaseOrders, seed.purchaseOrders),
    followUps: refreshFollowUpStatuses(loadFromStorage(STORAGE_KEYS.followUps, seed.followUps)),
    workflows: normalizeLoadedWorkflows(loadFromStorage(STORAGE_KEYS.workflows, seed.workflows)),
    automationExecutions: loadFromStorage(
      STORAGE_KEYS.automationExecutions,
      seed.automationExecutions
    ),
    aiConfiguration: loadFromStorage(STORAGE_KEYS.aiConfiguration, seed.aiConfiguration),
    aiCapabilities: loadFromStorage(STORAGE_KEYS.aiCapabilities, seed.aiCapabilities),
    aiExecutions: loadFromStorage(STORAGE_KEYS.aiExecutions, seed.aiExecutions),
    documents: loadFromStorage(STORAGE_KEYS.documents, seed.documents),
    documentVersions: loadFromStorage(STORAGE_KEYS.documentVersions, seed.documentVersions),
    documentProcessing: loadFromStorage(STORAGE_KEYS.documentProcessing, seed.documentProcessing),
    healthServices: loadFromStorage(STORAGE_KEYS.healthServices, seed.healthServices),
    healthCheckHistory: loadFromStorage(STORAGE_KEYS.healthCheckHistory, seed.healthCheckHistory),
    systemIncidents: loadFromStorage(STORAGE_KEYS.systemIncidents, seed.systemIncidents),
    backups: loadFromStorage(STORAGE_KEYS.backups, seed.backups),
    recoveryPoints: loadFromStorage(STORAGE_KEYS.recoveryPoints, seed.recoveryPoints),
    backupRetentionPolicy: loadFromStorage(STORAGE_KEYS.backupRetentionPolicy, seed.backupRetentionPolicy),
    users: loadFromStorage(STORAGE_KEYS.users, seed.users),
    userAccounts: loadFromStorage(STORAGE_KEYS.userAccounts, seed.userAccounts),
    notifications: normalizeLoadedNotifications(
      loadFromStorage(STORAGE_KEYS.notifications, seed.notifications)
    ),
    activities: loadFromStorage(STORAGE_KEYS.activities, seed.activities),
    salesTargets: normalizeLoadedSalesTargets(
      loadFromStorage(STORAGE_KEYS.salesTargets, seed.salesTargets)
    ),
    targetHistory: loadFromStorage(STORAGE_KEYS.targetHistory, seed.targetHistory),
    teamRequests: loadFromStorage(STORAGE_KEYS.teamRequests, seed.teamRequests),
    auditLogs: loadFromStorage(STORAGE_KEYS.auditLogs, seed.auditLogs),
    emailIntegrations: loadFromStorage(STORAGE_KEYS.emailIntegrations, seed.emailIntegrations),
    emailSyncRuns: loadFromStorage(STORAGE_KEYS.emailSyncRuns, seed.emailSyncRuns),
    rolePermissions: loadFromStorage(STORAGE_KEYS.rolePermissions, seed.rolePermissions),
    organization: loadFromStorage(STORAGE_KEYS.organization, seed.organization),
    settings: loadFromStorage(STORAGE_KEYS.settings, seed.settings),
    currentUserId: loadFromStorage(STORAGE_KEYS.currentUserId, seed.currentUserId),
  };
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSnapshot(): CRMState {
  return state;
}

export function resetStore() {
  state = createSeedState();
  clearAllStorage();
  clearMockLogoBlobs();
  persist(state);
  notify();
}

export function exportStoreData() {
  const viewer = getCurrentUser();
  if (viewer) {
    setState((s) =>
      withAuditEntries(s, [
        {
          action: "exported",
          entityType: "system",
          entityId: "organization-export",
          metadata: { scope: "organization" },
        },
      ])
    );
  }
  return exportAllStorage();
}

// --- Auth / User ---

function workingState(): CRMState {
  return applyScope(state, getDataScope(state, state.currentUserId));
}

function canAssignOwner(ownerId: string) {
  return canSeeOwner(getDataScope(state, state.currentUserId), ownerId);
}

function requireAssignableOwner(ownerId: string) {
  if (!canAssignOwner(ownerId)) {
    throw new Error("Cannot assign records outside the current data scope");
  }
}

export function getCurrentUser(): User | undefined {
  return getUserById(state, state.currentUserId);
}

export function getRolePermissionsState(): RolePermissionMap {
  return state.rolePermissions;
}

export function getEffectiveRolePermissions(role: PortalRole): Permission[] {
  return getRolePermissions(role, state.rolePermissions);
}

export function userHasPermission(user: User | undefined, permission: Permission): boolean {
  if (!user || !isPortalRole(user.role)) return false;
  return hasPermission(user.role, permission, state.rolePermissions);
}

export function userHasAnyPermission(user: User | undefined, permissions: Permission[]): boolean {
  if (!user || !isPortalRole(user.role)) return false;
  return hasAnyPermission(user.role, permissions, state.rolePermissions);
}

export function userHasAllPermissions(user: User | undefined, permissions: Permission[]): boolean {
  if (!user || !isPortalRole(user.role)) return false;
  return hasAllPermissions(user.role, permissions, state.rolePermissions);
}

export function updateRolePermissions(role: PortalRole, permissions: Permission[]): RolePermissionMap {
  const viewer = getCurrentUser();
  if (!viewer || !userHasPermission(viewer, "PERMISSION_MANAGE")) {
    throw new Error("Only administrators with permission management access can update role permissions");
  }

  const previous = getEffectiveRolePermissions(role);
  const next = sortPermissions(
    role === "admin" ? enforceProtectedAdminPermissions(permissions) : [...new Set(permissions)]
  );

  setState((s) =>
    withAuditEntries(
      {
        ...s,
        rolePermissions: {
          ...s.rolePermissions,
          [role]: next,
        },
      },
      [
        {
          action: "updated",
          entityType: "system",
          entityId: `role-permissions:${role}`,
          previousValue: { role, permissions: previous },
          newValue: { role, permissions: next },
          metadata: { label: "Role Permissions", roleName: role },
        },
      ]
    )
  );

  return state.rolePermissions;
}

export function setCurrentUser(userId: string) {
  setState((s) => ({ ...s, currentUserId: userId }));
}

export function clearCurrentUser() {
  setState((s) => ({ ...s, currentUserId: "" }));
}

export function getUsers() {
  return state.users;
}

export function getVisibleUsers() {
  return workingState().users;
}

function requireTargetManage() {
  const viewer = getCurrentUser();
  if (!viewer || !userHasPermission(viewer, "TARGET_MANAGE")) {
    throw new Error("Only administrators with target management access can perform this action");
  }
}

function requireNotificationView() {
  const viewer = getCurrentUser();
  if (!viewer || !userHasPermission(viewer, "NOTIFICATION_VIEW")) {
    throw new Error("Only users with notification access can view this page");
  }
}

function requireDataImport() {
  const viewer = getCurrentUser();
  if (!viewer || !userHasPermission(viewer, "DATA_IMPORT")) {
    throw new Error("Only administrators with import access can import data");
  }
}

function requireDataExport() {
  const viewer = getCurrentUser();
  if (!viewer || !userHasPermission(viewer, "DATA_EXPORT")) {
    throw new Error("Only administrators with export access can export data");
  }
}

function requireEmailIntegrationManage() {
  const viewer = getCurrentUser();
  if (!viewer || !userHasPermission(viewer, "EMAIL_INTEGRATION_MANAGE")) {
    throw new Error("Only administrators with email integration management access can perform this action");
  }
}

function requireEmailSyncManage() {
  const viewer = getCurrentUser();
  if (!viewer || !userHasPermission(viewer, "EMAIL_SYNC_MANAGE")) {
    throw new Error("Only administrators with email sync management access can perform this action");
  }
}

function requireAutomationView() {
  const viewer = getCurrentUser();
  if (!viewer || !userHasPermission(viewer, "AUTOMATION_VIEW")) {
    throw new Error("You do not have permission to view automation");
  }
}

function requireAutomationManage() {
  const viewer = getCurrentUser();
  if (!viewer || !userHasPermission(viewer, "AUTOMATION_MANAGE")) {
    throw new Error("You do not have permission to manage automation");
  }
}

function requireAutomationExecute() {
  const viewer = getCurrentUser();
  if (!viewer || !userHasPermission(viewer, "AUTOMATION_EXECUTE")) {
    throw new Error("You do not have permission to execute automation");
  }
}

function requireAutomationApprove() {
  const viewer = getCurrentUser();
  if (!viewer || !userHasPermission(viewer, "AUTOMATION_APPROVE")) {
    throw new Error("You do not have permission to approve automation");
  }
}

function requireAIView() {
  const viewer = getCurrentUser();
  if (!viewer || !userHasPermission(viewer, "AI_VIEW")) {
    throw new Error("You do not have permission to view AI configuration");
  }
}

function requireAIManage() {
  const viewer = getCurrentUser();
  if (!viewer || !userHasPermission(viewer, "AI_MANAGE")) {
    throw new Error("You do not have permission to manage AI configuration");
  }
}

function requireAIExecute() {
  const viewer = getCurrentUser();
  if (!viewer || !userHasPermission(viewer, "AI_EXECUTE")) {
    throw new Error("You do not have permission to execute AI capabilities");
  }
}

function requireAIApprove() {
  const viewer = getCurrentUser();
  if (!viewer || !userHasPermission(viewer, "AI_APPROVE")) {
    throw new Error("You do not have permission to approve AI results");
  }
}

function requireDocumentView() {
  const viewer = getCurrentUser();
  if (!viewer || !userHasPermission(viewer, "DOCUMENT_VIEW")) {
    throw new Error("You do not have permission to view documents");
  }
}

function requireDocumentManage() {
  const viewer = getCurrentUser();
  if (!viewer || !userHasPermission(viewer, "DOCUMENT_MANAGE")) {
    throw new Error("You do not have permission to manage documents");
  }
}

function requireDocumentUpload() {
  const viewer = getCurrentUser();
  if (!viewer || !userHasPermission(viewer, "DOCUMENT_UPLOAD")) {
    throw new Error("You do not have permission to upload documents");
  }
}

function requireDocumentProcess() {
  const viewer = getCurrentUser();
  if (!viewer || !userHasPermission(viewer, "DOCUMENT_PROCESS")) {
    throw new Error("You do not have permission to process documents");
  }
}

function requireDocumentApprove() {
  const viewer = getCurrentUser();
  if (!viewer || !userHasPermission(viewer, "DOCUMENT_APPROVE")) {
    throw new Error("You do not have permission to approve document reviews");
  }
}

function requireDocumentDelete() {
  const viewer = getCurrentUser();
  if (!viewer || !userHasPermission(viewer, "DOCUMENT_DELETE")) {
    throw new Error("You do not have permission to delete documents");
  }
}

function requireSystemHealthView() {
  const viewer = getCurrentUser();
  if (!viewer || !userHasPermission(viewer, "SYSTEM_HEALTH_VIEW")) {
    throw new Error("You do not have permission to view system health");
  }
}

function requireSystemHealthManage() {
  const viewer = getCurrentUser();
  if (!viewer || !userHasPermission(viewer, "SYSTEM_HEALTH_MANAGE")) {
    throw new Error("You do not have permission to manage system health");
  }
}

function requireBackupView() {
  const viewer = getCurrentUser();
  if (!viewer || !userHasPermission(viewer, "BACKUP_VIEW")) {
    throw new Error("You do not have permission to view backups");
  }
}

function requireBackupManage() {
  const viewer = getCurrentUser();
  if (!viewer || !userHasPermission(viewer, "BACKUP_MANAGE")) {
    throw new Error("You do not have permission to manage backups");
  }
}

function requireBackupRestore() {
  const viewer = getCurrentUser();
  if (!viewer || !userHasPermission(viewer, "BACKUP_RESTORE")) {
    throw new Error("You do not have permission to simulate backup restore");
  }
}

const targetApi = createTargetStore({
  getState: () => state,
  setState,
  withAuditEntries,
  requireTargetManage,
  userHasPermission: (permission) => userHasPermission(getCurrentUser(), permission as Permission),
});

const notificationApi = createNotificationStore({
  getState: () => state,
  setState,
  requireNotificationView,
});

const dataManagementApi = createDataManagementStore({
  getState: () => state,
  setState,
  withAuditEntries,
  requireDataImport,
  requireDataExport,
  getWorkingState: workingState,
});

const emailIntegrationApi = createEmailIntegrationStore({
  getState: () => state,
  setState,
  withAuditEntries,
  requireEmailIntegrationManage,
  requireEmailSyncManage,
  pushNotification: (notification) => {
    setState((s) => ({
      ...s,
      notifications: addNotification(s, {
        userId: s.currentUserId,
        type: "email",
        ...notification,
      }),
    }));
  },
});

const automationApi = createAutomationStore({
  getState: () => state,
  setState,
  withAuditEntries,
  requireAutomationView,
  requireAutomationManage,
  requireAutomationExecute,
  requireAutomationApprove,
  pushNotification: (notification) => {
    setState((s) => ({
      ...s,
      notifications: addNotification(s, {
        userId: s.currentUserId,
        type: "automation",
        ...notification,
      }),
    }));
  },
});

const aiApi = createAIStore({
  getState: () => state,
  setState,
  withAuditEntries,
  requireAIView,
  requireAIManage,
  requireAIExecute,
  requireAIApprove,
  pushNotification: (notification) => {
    setState((s) => ({
      ...s,
      notifications: addNotification(s, {
        userId: s.currentUserId,
        type: "ai",
        ...notification,
      }),
    }));
  },
});

const documentsApi = createDocumentsStore({
  getState: () => state,
  setState,
  withAuditEntries,
  requireDocumentView,
  requireDocumentManage,
  requireDocumentUpload,
  requireDocumentProcess,
  requireDocumentApprove,
  requireDocumentDelete,
  pushNotification: (notification) => {
    setState((s) => ({
      ...s,
      notifications: addNotification(s, {
        userId: s.currentUserId,
        type: "document",
        ...notification,
      }),
    }));
  },
});

const systemHealthApi = createSystemHealthStore({
  getState: () => state,
  setState,
  withAuditEntries,
  requireSystemHealthView,
  requireSystemHealthManage,
  pushNotification: (notification) => {
    setState((s) => ({
      ...s,
      notifications: addNotification(s, {
        userId: s.currentUserId,
        type: "system_health",
        ...notification,
      }),
    }));
  },
});

const backupsApi = createBackupsStore({
  getState: () => state,
  setState,
  withAuditEntries,
  requireBackupView,
  requireBackupManage,
  requireBackupRestore,
  pushNotification: (notification) => {
    setState((s) => ({
      ...s,
      notifications: addNotification(s, {
        userId: s.currentUserId,
        type: "backup",
        ...notification,
      }),
    }));
  },
});

function upsertSalesTarget(
  targets: CRMState["salesTargets"],
  userId: string,
  targetAmount: number,
  state: CRMState
) {
  const period = getDefaultTargetPeriod(state);
  const existing = targets.find(
    (item) => item.userId === userId && item.targetType === "salesperson"
  );
  const now = new Date().toISOString();
  if (existing) {
    return targets.map((item) =>
      item.id === existing.id
        ? { ...item, targetAmount, period, updatedAt: now }
        : item
    );
  }
  return [
    ...targets,
    normalizeSalesTarget({
      id: generateId("st"),
      userId,
      period,
      targetAmount,
      achievedAmount: 0,
      createdAt: now,
      updatedAt: now,
    }),
  ];
}

export function getSalesManagers() {
  return state.users.filter((user) => user.role === "sales_manager");
}

export function createUser(input: CreateUserInput): User {
  const viewer = getCurrentUser();
  if (!userHasPermission(viewer, "USER_CREATE")) {
    throw new Error("Only administrators can create users");
  }
  if (state.users.some((item) => item.email.toLowerCase() === input.email.trim().toLowerCase())) {
    throw new Error("A user with this email already exists");
  }
  const signInEmail = normalizeSignInEmail(input.signInEmail ?? input.email);
  if (!isSignInEmailAvailable(state, signInEmail)) {
    throw new Error("A sign-in account with this email already exists");
  }
  if (isAccountRole(input.role)) {
    if (!input.password?.trim()) {
      throw new Error("Initial password is required for sign-in accounts");
    }
  }
  if (input.status !== "active" && input.status !== "inactive") {
    throw new Error("Select a valid status");
  }
  const assignedManagerId =
    input.role === "salesperson" && input.managerId ? input.managerId : undefined;
  const manager = assignedManagerId ? getUserById(state, assignedManagerId) : undefined;
  if (assignedManagerId && (!manager || manager.role !== "sales_manager")) {
    throw new Error("Select a valid manager");
  }
  const team =
    input.role === "sales_manager"
      ? input.team?.trim() || undefined
      : input.role === "salesperson"
        ? manager?.team
        : input.team ?? manager?.team;
  if (team) assertActiveTeamName(team);
  const user: User = {
    id: generateId("user"),
    name: input.name.trim(),
    email: input.email.trim(),
    role: input.role,
    department: input.department,
    team,
    managerId: assignedManagerId,
    phone: input.phone?.trim() || undefined,
    status: input.status,
    lastActive: new Date().toISOString(),
  };
  setState((s) => {
    const users = [...s.users, user];
    const stateWithUser = { ...s, users };
    const account =
      isAccountRole(user.role) && input.password
        ? createUserAccountRecord(stateWithUser, {
            userId: user.id,
            email: signInEmail,
            password: input.password,
            role: user.role,
            status:
              input.accountStatus ??
              (user.status === "active" ? "active" : "disabled"),
            organizationId: DEFAULT_ORGANIZATION_ID,
          })
        : null;
    return withAuditEntries(
      {
        ...s,
        users,
        userAccounts: account ? [...s.userAccounts, account] : s.userAccounts,
        salesTargets:
          input.role === "salesperson"
            ? upsertSalesTarget(s.salesTargets, user.id, input.targetAmount ?? 0, s)
            : s.salesTargets,
        activities: addActivity(s, {
          type: "system",
          title: `User created: ${user.name}`,
          entityType: "user",
          entityId: user.id,
        }),
      },
      [
        {
          action: "created",
          entityType: "user",
          entityId: user.id,
          newValue: {
            name: user.name,
            email: user.email,
            role: user.role,
            team: user.team,
            managerId: user.managerId,
            status: user.status,
          },
          metadata: {
            role: user.role,
            targetAmount: input.role === "salesperson" ? input.targetAmount ?? 0 : undefined,
          },
        },
        ...(account
          ? [
              {
                action: "account_created" as const,
                entityType: "user_account" as const,
                entityId: account.id,
                newValue: {
                  userId: account.userId,
                  email: account.email,
                  role: account.role,
                  status: account.status,
                },
              },
            ]
          : []),
      ]
    );
  });
  return user;
}

export function updateUser(id: string, data: Partial<CreateUserInput>): User {
  const viewer = getCurrentUser();
  const existing = getUserById(state, id);
  if (!existing) throw new Error("User not found");
  if (viewer?.role === "sales_manager") {
    if (id !== viewer.id && !canViewManagedMember(viewer, id, state)) {
      throw new Error("You cannot update a user outside your team");
    }
    if (data.role) throw new Error("Managers cannot change user roles");
    if (data.managerId) throw new Error("Managers cannot reassign people to another manager");
    if (data.team && viewer.team && data.team !== viewer.team) {
      throw new Error("Managers cannot move people to another team");
    }
  } else if (viewer && viewer.role !== "admin" && id !== viewer.id) {
    throw new Error("You cannot update another user");
  }
  if (viewer && viewer.role !== "admin") {
    if (data.managerId) throw new Error("Only administrators can change manager assignments");
    if (data.team) throw new Error("Only administrators can change team assignments");
    if (data.targetAmount != null) throw new Error("Only administrators can change sales targets");
    if (data.status) throw new Error("Only administrators can change account status");
  }
  if (viewer && userHasPermission(viewer, "USER_ASSIGN") === false && data.managerId) {
    throw new Error("You do not have permission to change manager assignments");
  }
  if (viewer && userHasPermission(viewer, "TARGET_MANAGE") === false && data.targetAmount != null) {
    throw new Error("You do not have permission to change sales targets");
  }
  if (viewer && userHasPermission(viewer, "USER_ACTIVATE") === false && data.status) {
    throw new Error("You do not have permission to change account status");
  }
  if (data.managerId) {
    const assignedManager = getUserById(state, data.managerId);
    if (!assignedManager || assignedManager.role !== "sales_manager") {
      throw new Error("Select a valid manager");
    }
  }
  if (data.email) {
    const email = data.email.trim().toLowerCase();
    if (state.users.some((item) => item.id !== id && item.email.toLowerCase() === email)) {
      throw new Error("A user with this email already exists");
    }
  }
  const managerAssignmentSpecified = Object.prototype.hasOwnProperty.call(data, "managerId");
  const assignedManagerId = managerAssignmentSpecified
    ? data.managerId || undefined
    : existing.managerId;
  const manager = assignedManagerId ? getUserById(state, assignedManagerId) : undefined;
  const { targetAmount, team: teamInput, ...userFields } = data;
  const previousTarget = state.salesTargets.find((item) => item.userId === id);
  const auditEntries = buildUserUpdateAudits(
    existing,
    { ...userFields, team: teamInput, status: data.status },
    assignedManagerId,
    managerAssignmentSpecified,
    manager,
    targetAmount,
    previousTarget?.targetAmount,
    previousTarget?.id
  );
  let updated!: User;
  setState((s) => {
    const users = s.users.map((u) => {
      if (u.id !== id) return u;
      const nextTeam = managerAssignmentSpecified
        ? manager?.team
        : teamInput !== undefined
          ? teamInput.trim() || undefined
          : u.team;
      updated = {
        ...u,
        ...userFields,
        managerId: managerAssignmentSpecified ? assignedManagerId : u.managerId,
        phone:
          userFields.phone !== undefined
            ? userFields.phone.trim() || undefined
            : u.phone,
        team: nextTeam,
        lastActive: new Date().toISOString(),
      };
      return updated;
    });

    let userAccounts = s.userAccounts;
    const existingAcc = getAccountByUserId(s, id);
    const accountAudit: CreateAuditLogInput[] = [];

    if (existingAcc) {
      let nextAcc = existingAcc;
      const now = new Date().toISOString();

      if (userFields.signInEmail !== undefined) {
        const normalized = normalizeSignInEmail(userFields.signInEmail);
        if (!isSignInEmailAvailable(s, normalized, existingAcc.userId)) {
          throw new Error("An account with this sign-in email already exists.");
        }
        nextAcc = { ...nextAcc, email: normalized, updatedAt: now };
      }

      if (userFields.password) {
        nextAcc = {
          ...nextAcc,
          mockPasswordHash: mockHashPassword(userFields.password),
          updatedAt: now,
        };
      }

      if (userFields.accountStatus) {
        nextAcc = { ...nextAcc, status: userFields.accountStatus, updatedAt: now };
      } else if (userFields.status === "inactive" && existingAcc.status !== "disabled") {
        nextAcc = { ...nextAcc, status: "disabled", updatedAt: now };
        accountAudit.push({
          action: "account_disabled",
          entityType: "user_account",
          entityId: existingAcc.id,
          metadata: { profileId: id, email: existingAcc.email },
        });
      } else if (userFields.status === "active" && existingAcc.status === "disabled") {
        nextAcc = { ...nextAcc, status: "active", updatedAt: now };
        accountAudit.push({
          action: "account_enabled",
          entityType: "user_account",
          entityId: existingAcc.id,
          metadata: { profileId: id, email: existingAcc.email },
        });
      }

      if (nextAcc !== existingAcc) {
        userAccounts = userAccounts.map((a) => (a.id === nextAcc.id ? nextAcc : a));
        if (
          nextAcc.email !== existingAcc.email ||
          nextAcc.status !== existingAcc.status ||
          (userFields.password && nextAcc.mockPasswordHash !== existingAcc.mockPasswordHash)
        ) {
          accountAudit.push({
            action: "account_updated",
            entityType: "user_account",
            entityId: existingAcc.id,
            metadata: { profileId: id, email: nextAcc.email },
          });
        }
      }
    }

    return withAuditEntries(
      {
        ...s,
        users,
        userAccounts,
        salesTargets:
          targetAmount != null ? upsertSalesTarget(s.salesTargets, id, targetAmount, s) : s.salesTargets,
      },
      [...auditEntries, ...accountAudit]
    );
  });
  return updated;
}

export function deactivateUser(id: string) {
  updateUser(id, { status: "inactive" });
}

// --- Customers ---

export function getCustomers(): Customer[] {
  return workingState().customers.map((c) => enrichCustomer(c, workingState()));
}

export function getCustomer(id: string): Customer | undefined {
  const viewer = getCurrentUser();
  if (viewer && !canViewCustomer(viewer, id, state)) return undefined;
  const scoped = workingState();
  const customer = scoped.customers.find((c) => c.id === id);
  return customer ? enrichCustomer(customer, scoped) : undefined;
}

export function getCustomerAccessStatus(customerId: string) {
  return buildCustomerAccessStatus(state, state.currentUserId, customerId);
}

export function getTeamCustomers() {
  const viewer = getCurrentUser();
  if (!viewer || viewer.role !== "sales_manager") return [];
  return buildTeamCustomers(state, viewer);
}

export function getTeamCustomerOwners() {
  const viewer = getCurrentUser();
  if (!viewer || viewer.role !== "sales_manager") return [];
  return buildTeamCustomerOwners(state, viewer);
}

export function getTeamCustomersSummary() {
  const viewer = getCurrentUser();
  if (!viewer || viewer.role !== "sales_manager") {
    return {
      totalCustomers: 0,
      activeCustomers: 0,
      totalRevenue: 0,
      totalActiveDeals: 0,
      teamMemberCount: 0,
    };
  }
  return buildTeamCustomersSummary(state, viewer);
}

export function createCustomer(input: CreateCustomerInput): Customer {
  requireAssignableOwner(input.ownerId);
  const owner = getUserById(state, input.ownerId);
  const customer: Customer = {
    id: generateId("cust"),
    name: input.name,
    industry: input.industry,
    location: input.location,
    owner: owner?.name ?? "Unassigned",
    ownerId: input.ownerId,
    contactName: input.contactName,
    contactEmail: input.contactEmail,
    contactPhone: input.contactPhone,
    activeDeals: 0,
    revenue: 0,
    lastActivity: new Date().toISOString(),
    status: input.status,
  };
  setState((s) => ({
    ...s,
    customers: [...s.customers, customer],
    activities: addActivity(s, {
      type: "customer",
      title: `Customer created: ${customer.name}`,
      customerId: customer.id,
      entityType: "customer",
      entityId: customer.id,
    }),
    notifications: addNotification(s, {
      userId: s.currentUserId,
      title: "Customer created",
      message: `${customer.name} added to CRM`,
      type: "system",
      href: `/customers/${customer.id}`,
    }),
  }));
  return enrichCustomer(customer, getSnapshot());
}

export function updateCustomer(id: string, data: Partial<CreateCustomerInput>): Customer {
  if (data.ownerId) requireAssignableOwner(data.ownerId);
  let updated!: Customer;
  setState((s) => ({
    ...s,
    customers: s.customers.map((c) => {
      if (c.id !== id) return c;
      const owner = data.ownerId ? getUserById(s, data.ownerId) : undefined;
      updated = {
        ...c,
        ...data,
        owner: owner?.name ?? c.owner,
        ownerId: data.ownerId ?? c.ownerId,
        lastActivity: new Date().toISOString(),
      };
      return updated;
    }),
    activities: addActivity(s, {
      type: "customer",
      title: `Customer updated: ${data.name ?? id}`,
      customerId: id,
      entityType: "customer",
      entityId: id,
    }),
  }));
  return enrichCustomer(updated, getSnapshot());
}

export function deleteCustomer(id: string) {
  const viewer = getCurrentUser();
  if (viewer && !canViewCustomer(viewer, id, state)) {
    throw new Error("Cannot delete customers outside the current data scope");
  }
  setState((s) => ({
    ...s,
    customers: s.customers.filter((c) => c.id !== id),
    contacts: s.contacts.filter((c) => c.companyId !== id),
    activities: addActivity(s, {
      type: "customer",
      title: "Customer deleted",
      entityType: "customer",
      entityId: id,
    }),
  }));
}

// --- Contacts ---

export function getContacts(): Contact[] {
  return workingState().contacts;
}

export function getContact(id: string): Contact | undefined {
  const viewer = getCurrentUser();
  if (viewer && !canViewContact(viewer, id, state)) return undefined;
  return workingState().contacts.find((contact) => contact.id === id);
}

export function getContactAccessStatus(contactId: string) {
  return buildContactAccessStatus(state, state.currentUserId, contactId);
}

export function getTeamContacts() {
  const viewer = getCurrentUser();
  if (!viewer || viewer.role !== "sales_manager") return [];
  return buildTeamContacts(state, viewer);
}

export function getTeamContactOwners() {
  const viewer = getCurrentUser();
  if (!viewer || viewer.role !== "sales_manager") return [];
  return buildTeamContactOwners(state, viewer);
}

export function getTeamContactsSummary() {
  const viewer = getCurrentUser();
  if (!viewer || viewer.role !== "sales_manager") {
    return { totalContacts: 0, activeContacts: 0, companiesRepresented: 0, teamMemberCount: 0 };
  }
  return buildTeamContactsSummary(state, viewer);
}

export function getContactsByCustomer(customerId: string) {
  return workingState().contacts.filter((c) => c.companyId === customerId);
}

export function createContact(input: CreateContactInput): Contact {
  requireAssignableOwner(input.ownerId);
  const customer = state.customers.find((c) => c.id === input.companyId);
  const owner = getUserById(state, input.ownerId);
  const contact: Contact = {
    id: generateId("cont"),
    name: input.name,
    company: customer?.name ?? "",
    companyId: input.companyId,
    designation: input.designation,
    email: input.email,
    phone: input.phone,
    owner: owner?.name ?? "",
    ownerId: input.ownerId,
    lastContact: new Date().toISOString(),
    status: input.status,
  };
  setState((s) => ({
    ...s,
    contacts: [...s.contacts, contact],
    activities: addActivity(s, {
      type: "contact",
      title: `Contact created: ${contact.name}`,
      customerId: input.companyId,
      entityType: "contact",
      entityId: contact.id,
    }),
  }));
  return contact;
}

export function updateContact(id: string, data: Partial<CreateContactInput>): Contact {
  if (data.ownerId) requireAssignableOwner(data.ownerId);
  let updated!: Contact;
  setState((s) => ({
    ...s,
    contacts: s.contacts.map((c) => {
      if (c.id !== id) return c;
      const customer = data.companyId
        ? s.customers.find((x) => x.id === data.companyId)
        : undefined;
      const owner = data.ownerId ? getUserById(s, data.ownerId) : undefined;
      updated = {
        ...c,
        ...data,
        company: customer?.name ?? c.company,
        companyId: data.companyId ?? c.companyId,
        owner: owner?.name ?? c.owner,
        ownerId: data.ownerId ?? c.ownerId,
        lastContact: new Date().toISOString(),
      };
      return updated;
    }),
  }));
  return updated;
}

export function deleteContact(id: string) {
  const viewer = getCurrentUser();
  if (viewer && !canViewContact(viewer, id, state)) {
    throw new Error("Cannot delete contacts outside the current data scope");
  }
  setState((s) => ({
    ...s,
    contacts: s.contacts.filter((c) => c.id !== id),
  }));
}

// --- Deals ---

export function getDeals(): Deal[] {
  const scoped = workingState();
  return scoped.deals.map((d) => enrichDeal(d, scoped));
}

export function getDeal(id: string): Deal | undefined {
  const viewer = getCurrentUser();
  if (viewer && !canViewDeal(viewer, id, state)) return undefined;
  const scoped = workingState();
  const deal = scoped.deals.find((d) => d.id === id);
  return deal ? enrichDeal(deal, scoped) : undefined;
}

export function getDealAccessStatus(dealId: string) {
  return buildDealAccessStatus(state, state.currentUserId, dealId);
}

export function getTeamDeals() {
  const viewer = getCurrentUser();
  if (!viewer || viewer.role !== "sales_manager") return [];
  return buildTeamDeals(state, viewer);
}

export function getTeamDealOwners() {
  const viewer = getCurrentUser();
  if (!viewer || viewer.role !== "sales_manager") return [];
  return buildTeamDealOwners(state, viewer);
}

export function getTeamDealsSummary() {
  const viewer = getCurrentUser();
  if (!viewer || viewer.role !== "sales_manager") {
    return {
      totalDeals: 0,
      pipelineValue: 0,
      wonValue: 0,
      wonCount: 0,
      lostCount: 0,
      activeCount: 0,
      winRate: 0,
      averageDealValue: 0,
    };
  }
  return buildTeamDealsSummary(state, viewer);
}

export function getDealsByCustomer(customerId: string) {
  const scoped = workingState();
  return scoped.deals
    .filter((d) => d.customerId === customerId)
    .map((d) => enrichDeal(d, scoped));
}

export function createDeal(input: CreateDealInput): Deal {
  requireAssignableOwner(input.ownerId);
  const customer = state.customers.find((c) => c.id === input.customerId);
  const owner = getUserById(state, input.ownerId);
  const deal: Deal = {
    id: generateId("deal"),
    title: input.title,
    customerId: input.customerId,
    customerName: customer?.name ?? "",
    owner: owner?.name ?? "",
    ownerId: input.ownerId,
    value: input.value,
    stage: input.stage,
    probability: input.probability,
    expectedClose: input.expectedClose,
    lastActivity: new Date().toISOString(),
    emailCount: 0,
  };
  setState((s) => ({
    ...s,
    deals: [...s.deals, deal],
    customers: touchCustomerLastActivity(s.customers, deal.customerId),
    activities: addActivity(s, {
      type: "deal",
      title: `Deal created: ${deal.title}`,
      description: `Stage: ${deal.stage}`,
      customerId: deal.customerId,
      dealId: deal.id,
      entityType: "deal",
      entityId: deal.id,
    }),
    notifications: addNotification(s, {
      userId: s.currentUserId,
      title: "Deal created",
      message: `${deal.title} for ${deal.customerName}`,
      type: "deal",
      href: `/deals/${deal.id}`,
    }),
  }));
  return enrichDeal(deal, getSnapshot());
}

export function updateDeal(id: string, data: Partial<CreateDealInput>): Deal {
  if (data.ownerId) requireAssignableOwner(data.ownerId);
  const existing = state.deals.find((d) => d.id === id);
  let updated!: Deal;
  setState((s) => {
    const deals = s.deals.map((d) => {
      if (d.id !== id) return d;
      const customer = data.customerId
        ? s.customers.find((c) => c.id === data.customerId)
        : undefined;
      const nextOwnerId = data.ownerId && canAssignOwner(data.ownerId) ? data.ownerId : d.ownerId;
      const owner = nextOwnerId !== d.ownerId ? getUserById(s, nextOwnerId) : undefined;
      updated = {
        ...d,
        ...data,
        customerName: customer?.name ?? d.customerName,
        customerId: data.customerId ?? d.customerId,
        owner: owner?.name ?? d.owner,
        ownerId: nextOwnerId,
        lastActivity: new Date().toISOString(),
      };
      return updated;
    });
    return withAuditEntries(
      {
        ...s,
        deals,
        activities: addActivity(s, {
          type: "deal",
          title: `Deal updated: ${data.title ?? id}`,
          dealId: id,
          entityType: "deal",
          entityId: id,
        }),
      },
      existing
        ? [
            {
              action: "updated",
              entityType: "deal",
              entityId: id,
              previousValue: {
                title: existing.title,
                stage: existing.stage,
                value: existing.value,
                probability: existing.probability,
              },
              newValue: {
                title: updated.title,
                stage: updated.stage,
                value: updated.value,
                probability: updated.probability,
              },
              metadata: { customerName: updated.customerName },
            },
          ]
        : []
    );
  });
  return enrichDeal(updated, getSnapshot());
}

export function updateDealStage(id: string, stage: DealStage): Deal {
  let updated!: Deal;
  setState((s) => {
    const deals = s.deals.map((d) => {
      if (d.id !== id) return d;
      updated = {
        ...d,
        stage,
        probability: stage === "won" ? 100 : stage === "lost" ? 0 : d.probability,
        lastActivity: new Date().toISOString(),
      };
      return updated;
    });
    const nextState = { ...s, deals };
    let notifications = addNotification(s, {
      userId: s.currentUserId,
      title: "Deal stage updated",
      message: `${updated.title} → ${stage}`,
      type: "deal",
      href: `/deals/${id}`,
    });
    if (stage === "won") {
      notifications = addNotification(
        { ...s, notifications },
        {
          userId: s.currentUserId,
          title: "Deal won",
          message: `${updated.title} closed successfully`,
          type: "deal",
          href: `/deals/${id}`,
        }
      );
    }
    return {
      ...nextState,
      customers: touchCustomerLastActivity(s.customers, updated.customerId),
      salesTargets: stage === "won" ? recalculateSalesTargets(nextState) : s.salesTargets,
      activities: addActivity(s, {
        type: "deal",
        title: `Deal moved to ${stage}`,
        description: updated?.title,
        dealId: id,
        customerId: updated?.customerId,
        entityType: "deal",
        entityId: id,
      }),
      notifications,
    };
  });
  return enrichDeal(updated, getSnapshot());
}

export function deleteDeal(id: string) {
  const viewer = getCurrentUser();
  if (viewer && !canViewDeal(viewer, id, state)) {
    throw new Error("Cannot delete deals outside the current data scope");
  }
  setState((s) => ({
    ...s,
    deals: s.deals.filter((d) => d.id !== id),
  }));
}

// --- Emails ---

export function getEmails(folder?: EmailThread["folder"] | "important") {
  let emails = [...workingState().emails];
  if (folder === "important") emails = emails.filter((e) => e.important);
  else if (folder) emails = emails.filter((e) => e.folder === folder);
  return emails.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getEmail(id: string) {
  const viewer = getCurrentUser();
  if (viewer && !canViewEmail(viewer, id, state)) return undefined;
  return workingState().emails.find((e) => e.id === id);
}

export function getEmailAccessStatus(emailId: string) {
  return buildEmailAccessStatus(state, state.currentUserId, emailId);
}

export function getTeamInboxSummary() {
  const viewer = getCurrentUser();
  if (!viewer || viewer.role !== "sales_manager") {
    return { totalEmails: 0, unreadCount: 0, importantCount: 0, linkedDeals: 0, linkedCustomers: 0 };
  }
  return buildTeamInboxSummary(state, viewer);
}

export function getTeamPipelineSummary() {
  const viewer = getCurrentUser();
  if (!viewer || viewer.role !== "sales_manager") {
    return { totalPipelineValue: 0, totalDeals: 0, activeDeals: 0, wonValue: 0, stages: [] };
  }
  return buildTeamPipelineSummary(state, viewer);
}

export function markEmailRead(id: string) {
  setState((s) => ({
    ...s,
    emails: s.emails.map((e) => (e.id === id ? { ...e, read: true } : e)),
  }));
}

export function sendEmail(input: ComposeEmailInput): EmailThread {
  const deal = input.dealId ? state.deals.find((d) => d.id === input.dealId) : undefined;
  const customerId = input.customerId ?? deal?.customerId;
  const customer = customerId
    ? state.customers.find((c) => c.id === customerId)
    : undefined;
  const user = getCurrentUser();
  const email: EmailThread = {
    id: generateId("email"),
    subject: input.subject,
    from: user?.name ?? "You",
    fromEmail: user?.email ?? "",
    preview: input.body.slice(0, 120),
    date: new Date().toISOString(),
    read: true,
    important: false,
    folder: "sent",
    customerId,
    customerName: customer?.name ?? deal?.customerName,
    dealId: input.dealId,
    dealTitle: deal?.title,
    messages: [
      {
        id: generateId("msg"),
        from: `${user?.name} <${user?.email}>`,
        to: input.to,
        date: new Date().toISOString(),
        body: input.body,
      },
    ],
  };
  setState((s) => ({
    ...s,
    emails: [email, ...s.emails],
    deals: touchDealLastActivity(s.deals, input.dealId),
    customers: touchCustomerLastActivity(s.customers, customerId),
    activities: addActivity(s, {
      type: "email",
      title: `Email sent: ${input.subject}`,
      customerId,
      dealId: input.dealId,
      entityType: "email",
      entityId: email.id,
    }),
  }));
  return email;
}

export function saveDraft(input: ComposeEmailInput): EmailThread {
  const draft: EmailThread = {
    id: generateId("email"),
    subject: input.subject || "(No subject)",
    from: getCurrentUser()?.name ?? "You",
    fromEmail: getCurrentUser()?.email ?? "",
    preview: input.body.slice(0, 120) || "Empty draft",
    date: new Date().toISOString(),
    read: true,
    important: false,
    folder: "drafts",
    customerId: input.customerId,
    dealId: input.dealId,
    messages: [
      {
        id: generateId("msg"),
        from: getCurrentUser()?.email ?? "",
        to: input.to,
        date: new Date().toISOString(),
        body: input.body,
      },
    ],
  };
  setState((s) => ({ ...s, emails: [draft, ...s.emails] }));
  return draft;
}

export function deleteEmail(id: string) {
  setState((s) => ({ ...s, emails: s.emails.filter((e) => e.id !== id) }));
}

export function linkEmailToDeal(emailId: string, dealId: string) {
  const deal = state.deals.find((d) => d.id === dealId);
  const email = state.emails.find((e) => e.id === emailId);
  setState((s) => ({
    ...s,
    emails: s.emails.map((e) =>
      e.id === emailId
        ? {
            ...e,
            dealId,
            dealTitle: deal?.title,
            customerId: deal?.customerId ?? e.customerId,
            customerName: deal?.customerName ?? e.customerName,
          }
        : e
    ),
    deals: touchDealLastActivity(s.deals, dealId),
    customers: touchCustomerLastActivity(s.customers, deal?.customerId),
    activities: addActivity(s, {
      type: "email",
      title: `Email linked to deal: ${email?.subject ?? "Message"}`,
      customerId: deal?.customerId,
      dealId,
      entityType: "email",
      entityId: emailId,
    }),
  }));
}

// --- Purchase Orders ---

export function getPurchaseOrders(): PurchaseOrder[] {
  return workingState().purchaseOrders;
}

export function getPurchaseOrder(id: string) {
  const viewer = getCurrentUser();
  if (viewer && !canViewPurchaseOrder(viewer, id, state)) return undefined;
  return workingState().purchaseOrders.find((p) => p.id === id);
}

export function getPurchaseOrderAccessStatus(poId: string) {
  return buildPurchaseOrderAccessStatus(state, state.currentUserId, poId);
}

export function getTeamPurchaseOrders() {
  const viewer = getCurrentUser();
  if (!viewer || viewer.role !== "sales_manager") return [];
  return buildTeamPurchaseOrders(state, viewer);
}

export function getTeamPOOwners() {
  const viewer = getCurrentUser();
  if (!viewer || viewer.role !== "sales_manager") return [];
  return buildTeamPOOwners(state, viewer);
}

export function getTeamPurchaseOrdersSummary() {
  const viewer = getCurrentUser();
  if (!viewer || viewer.role !== "sales_manager") {
    return {
      totalPOs: 0,
      totalValue: 0,
      pendingCount: 0,
      approvedCount: 0,
      cancelledCount: 0,
      completedCount: 0,
      processingCount: 0,
    };
  }
  return buildTeamPurchaseOrdersSummary(state, viewer);
}

export function getPOsByCustomer(customerId: string) {
  return workingState().purchaseOrders.filter((p) => p.customerId === customerId);
}

export function getPOsByDeal(dealId: string) {
  return workingState().purchaseOrders.filter((p) => p.dealId === dealId);
}

export function createPurchaseOrder(input: CreatePOInput): PurchaseOrder {
  requireAssignableOwner(input.ownerId);
  const customer = state.customers.find((c) => c.id === input.customerId);
  const deal = state.deals.find((d) => d.id === input.dealId);
  const owner = getUserById(state, input.ownerId);
  const po: PurchaseOrder = {
    id: generateId("po"),
    poNumber: input.poNumber,
    customerId: input.customerId,
    customerName: customer?.name ?? "",
    dealId: input.dealId,
    dealTitle: deal?.title ?? "",
    amount: input.amount,
    poDate: input.poDate,
    deliveryDate: input.deliveryDate,
    status: input.status,
    owner: owner?.name ?? "",
    ownerId: input.ownerId,
    documentName: input.documentName,
    documentSize: input.documentSize,
    documentType: input.documentType,
    aiConfidence: 96,
    tax: Math.round(input.amount * 0.18),
    total: Math.round(input.amount * 1.18),
  };
  setState((s) => ({
    ...s,
    purchaseOrders: [...s.purchaseOrders, po],
    deals: touchDealLastActivity(s.deals, po.dealId),
    customers: touchCustomerLastActivity(s.customers, po.customerId),
    activities: addActivity(s, {
      type: "po",
      title: `PO uploaded: ${po.poNumber}`,
      customerId: po.customerId,
      dealId: po.dealId,
      entityType: "po",
      entityId: po.id,
    }),
    notifications: addNotification(s, {
      userId: s.currentUserId,
      title: "PO received",
      message: `${po.poNumber} from ${po.customerName}`,
      type: "po",
      href: `/purchase-orders/${po.id}`,
    }),
  }));
  return po;
}

export function updatePurchaseOrder(
  id: string,
  data: Partial<CreatePOInput & { items?: PurchaseOrder["items"]; tax?: number; total?: number; aiConfidence?: number }>
): PurchaseOrder {
  let updated!: PurchaseOrder;
  setState((s) => {
    const previous = s.purchaseOrders.find((p) => p.id === id);
    const purchaseOrders = s.purchaseOrders.map((p) => {
      if (p.id !== id) return p;
      updated = { ...p, ...data };
      return updated;
    });
    const approved = data.status === "approved" && previous?.status !== "approved";
    return withAuditEntries(
      {
        ...s,
        purchaseOrders,
        deals: touchDealLastActivity(s.deals, updated.dealId),
        customers: touchCustomerLastActivity(s.customers, updated.customerId),
        activities: addActivity(s, {
          type: "po",
          title: approved ? `PO approved: ${updated.poNumber}` : `PO updated: ${updated.poNumber}`,
          customerId: updated.customerId,
          dealId: updated.dealId,
          entityType: "po",
          entityId: id,
        }),
        notifications: approved
          ? addNotification(s, {
              userId: s.currentUserId,
              title: "PO approved",
              message: `${updated.poNumber} approved for ${updated.dealTitle}`,
              type: "po",
              href: `/purchase-orders/${id}`,
            })
          : s.notifications,
      },
      approved
        ? [
            {
              action: "approved",
              entityType: "purchase_order",
              entityId: id,
              previousValue: { status: previous?.status },
              newValue: { status: "approved", poNumber: updated.poNumber },
              metadata: { customerName: updated.customerName },
            },
          ]
        : []
    );
  });
  return updated;
}

export function deletePurchaseOrder(id: string) {
  const viewer = getCurrentUser();
  if (viewer && !canViewPurchaseOrder(viewer, id, state)) {
    throw new Error("Purchase order not found");
  }
  setState((s) => ({
    ...s,
    purchaseOrders: s.purchaseOrders.filter((p) => p.id !== id),
  }));
}

// --- Follow-ups ---

export function getFollowUps() {
  return refreshFollowUpStatuses(workingState().followUps);
}

export function getFollowUpAccessStatus(followUpId: string) {
  return buildFollowUpAccessStatus(state, state.currentUserId, followUpId);
}

export function getTeamFollowUps() {
  const viewer = getCurrentUser();
  if (!viewer || viewer.role !== "sales_manager") return [];
  return buildTeamFollowUps(state, viewer);
}

export function getTeamFollowUpOwners() {
  const viewer = getCurrentUser();
  if (!viewer || viewer.role !== "sales_manager") return [];
  return buildTeamFollowUpOwners(state, viewer);
}

export function getTeamFollowUpsSummary() {
  const viewer = getCurrentUser();
  if (!viewer || viewer.role !== "sales_manager") {
    return {
      totalFollowUps: 0,
      overdueCount: 0,
      todayCount: 0,
      upcomingCount: 0,
      completedCount: 0,
    };
  }
  return buildTeamFollowUpsSummary(state, viewer);
}

export function getFollowUpCounts() {
  const items = getFollowUps();
  return {
    completed: items.filter((item) => item.status === "completed").length,
    pending: items.filter((item) => item.status !== "completed").length,
    overdue: items.filter((item) => item.status === "overdue").length,
  };
}

export function getFollowUpsByDeal(dealId: string) {
  return refreshFollowUpStatuses(workingState().followUps.filter((f) => f.dealId === dealId));
}

export function createFollowUp(input: CreateFollowUpInput): FollowUp {
  requireAssignableOwner(input.ownerId);
  const customer = state.customers.find((c) => c.id === input.customerId);
  const deal = state.deals.find((d) => d.id === input.dealId);
  const owner = getUserById(state, input.ownerId);
  const followUp: FollowUp = {
    id: generateId("fu"),
    title: input.title,
    description: input.description,
    customerId: input.customerId,
    customerName: customer?.name ?? "",
    dealId: input.dealId,
    dealTitle: deal?.title ?? "",
    dueDate: input.dueDate,
    status: computeFollowUpStatus(input.dueDate, "upcoming"),
    priority: input.priority ?? "medium",
    owner: owner?.name ?? "",
    ownerId: input.ownerId,
    createdAt: new Date().toISOString(),
  };
  setState((s) => ({
    ...s,
    followUps: [...s.followUps, followUp],
    deals: touchDealLastActivity(s.deals, followUp.dealId),
    customers: touchCustomerLastActivity(s.customers, followUp.customerId),
    activities: addActivity(s, {
      type: "follow-up",
      title: `Follow-up created: ${followUp.title}`,
      dealId: followUp.dealId,
      customerId: followUp.customerId,
      entityType: "follow-up",
      entityId: followUp.id,
    }),
  }));
  return followUp;
}

export function updateFollowUp(id: string, data: Partial<CreateFollowUpInput>): FollowUp {
  if (data.ownerId) requireAssignableOwner(data.ownerId);
  let updated!: FollowUp;
  setState((s) => ({
    ...s,
    followUps: s.followUps.map((f) => {
      if (f.id !== id) return f;
      const nextOwnerId = data.ownerId && canAssignOwner(data.ownerId) ? data.ownerId : f.ownerId;
      const owner = nextOwnerId !== f.ownerId ? getUserById(s, nextOwnerId) : undefined;
      updated = {
        ...f,
        ...data,
        owner: owner?.name ?? f.owner,
        ownerId: nextOwnerId,
        status: data.dueDate
          ? computeFollowUpStatus(data.dueDate, f.status)
          : f.status,
      };
      return updated;
    }),
  }));
  return updated;
}

export function completeFollowUp(id: string) {
  const followUp = state.followUps.find((f) => f.id === id);
  setState((s) =>
    withAuditEntries(
      {
        ...s,
        followUps: s.followUps.map((f) =>
          f.id === id ? { ...f, status: "completed" as FollowUpStatus } : f
        ),
        deals: touchDealLastActivity(s.deals, followUp?.dealId),
        activities: addActivity(s, {
          type: "follow-up",
          title: "Follow-up completed",
          dealId: followUp?.dealId,
          customerId: followUp?.customerId,
          entityType: "follow-up",
          entityId: id,
        }),
      },
      followUp
        ? [
            {
              action: "updated",
              entityType: "follow_up",
              entityId: id,
              previousValue: { status: followUp.status },
              newValue: { status: "completed" },
              metadata: { title: followUp.title },
            },
          ]
        : []
    )
  );
}

export function rescheduleFollowUp(id: string, dueDate: string) {
  updateFollowUp(id, { dueDate });
}

export function deleteFollowUp(id: string) {
  setState((s) => ({
    ...s,
    followUps: s.followUps.filter((f) => f.id !== id),
  }));
}

// --- Workflows (delegated to automation store) ---

export const {
  getWorkflows,
  getWorkflow,
  createWorkflow,
  updateWorkflow,
  activateWorkflow,
  pauseWorkflow,
  archiveWorkflow,
  duplicateWorkflow,
  executeWorkflow,
  retryExecution,
  approveExecution,
  rejectExecution,
  validateWorkflow,
  deleteWorkflow,
  toggleWorkflow,
  runWorkflow,
} = automationApi;

export function getExecutions(workflowId?: string) {
  const allowedIds = new Set(
    buildAutomationExecutionsForUser(state, state.currentUserId).map((item) => item.id)
  );
  return automationApi.getExecutions(workflowId).filter((item) => allowedIds.has(item.id));
}

export function getExecution(id: string) {
  const viewer = getCurrentUser();
  if (viewer && !canViewAutomationExecution(viewer, id, state)) {
    throw new Error("Execution not found");
  }
  return automationApi.getExecution(id);
}

export function getAutomationExecutionAccessStatus(executionId: string) {
  return buildAutomationExecutionAccessStatus(state, state.currentUserId, executionId);
}

export function getTeamAutomationSummary() {
  const viewer = getCurrentUser();
  if (!viewer || viewer.role !== "sales_manager") {
    return { pendingApprovals: 0, totalExecutions: 0, succeededCount: 0, failedCount: 0 };
  }
  return buildTeamAutomationSummary(state, viewer);
}

export function getPendingAutomationApprovals() {
  const viewer = getCurrentUser();
  if (!viewer || viewer.role !== "sales_manager") return [];
  return buildPendingApprovalsForManager(state, viewer);
}

// --- AI (delegated to AI store) ---

export const {
  getConfiguration: getAIConfiguration,
  updateConfiguration: updateAIConfiguration,
  getProviders: getAIProviders,
  getModels: getAIModels,
  getCapabilities: getAICapabilities,
  getCapability: getAICapability,
  updateCapability: updateAICapability,
  getExecutions: getAIExecutions,
  getExecution: getAIExecution,
  getUsage: getAIUsage,
  getAIStatus,
  runCapability: runAICapability,
  retryExecution: retryAIExecution,
  approveExecution: approveAIExecution,
  rejectExecution: rejectAIExecution,
} = aiApi;

// --- Documents (delegated to documents store) ---

export const {
  listDocuments: getDocuments,
  getDocument,
  getDocumentSummary,
  getDocumentVersions,
  getProcessingHistory: getDocumentProcessingHistory,
  uploadDocument,
  createDocumentVersion,
  updateDocument,
  linkDocument,
  archiveDocument,
  requestDeleteDocument,
  startDocumentProcessing,
  approveDocumentReview,
  rejectDocumentReview,
  getSignedDownloadUrl,
  getPreviewUrl,
} = documentsApi;

// --- System Health ---

export const {
  getHealthServices,
  getHealthService,
  getSystemHealth,
  getSystemHealthStatus,
  getHealthHistory,
  getIncidents,
  checkHealth,
} = systemHealthApi;

// --- Backups ---

export const {
  getBackups,
  getBackup,
  getRecoveryPoints,
  getRecoveryPoint,
  getRetentionPolicy,
  getBackupSummary,
  getBackupSecurityReadiness,
  createBackup,
  updateRetentionPolicy,
  verifyBackup,
  simulateRestore,
} = backupsApi;

// --- Activities ---

export function getActivities(filters?: { customerId?: string; dealId?: string; actorId?: string }) {
  const scoped = workingState();
  let activities = [...scoped.activities];
  if (filters?.customerId) {
    const customerDealIds = scoped.deals
      .filter((d) => d.customerId === filters.customerId)
      .map((d) => d.id);
    activities = activities.filter(
      (a) =>
        a.customerId === filters.customerId ||
        (a.dealId != null && customerDealIds.includes(a.dealId))
    );
  }
  if (filters?.dealId) {
    activities = activities.filter((a) => a.dealId === filters.dealId);
  }
  if (filters?.actorId) {
    const ownedDealIds = scoped.deals
      .filter((d) => d.ownerId === filters.actorId)
      .map((d) => d.id);
    activities = activities.filter(
      (a) =>
        a.actorId === filters.actorId ||
        (a.dealId != null && ownedDealIds.includes(a.dealId))
    );
  }
  return activities.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

// --- Notifications ---

export function getNotifications() {
  return notificationApi.getScopedNotifications();
}

export function getUnreadNotificationCount() {
  return notificationApi.getUnreadNotificationCount();
}

export function markNotificationRead(id: string) {
  notificationApi.markNotificationRead(id);
}

export function markAllNotificationsRead() {
  notificationApi.markAllNotificationsRead();
}

export function getAdminNotifications(
  filter: "all" | "unread" | "critical" | "warnings" = "all"
) {
  return notificationApi.getAdminNotifications(filter);
}

export function syncAdminNotifications() {
  notificationApi.syncAdminSystemNotifications();
}

// --- Settings ---

export function getSettings(): AppSettings {
  return state.settings;
}

export function updateSettings(data: Partial<AppSettings>) {
  setState((s) => ({ ...s, settings: { ...s.settings, ...data } }));
}

// --- Dashboard / Reports ---

export function getDashboardMetrics() {
  const viewer = getCurrentUser();
  const metrics = calculateDashboardMetrics(workingState());
  if (viewer?.role === "sales_manager") {
    const overview = buildMyTeamOverview(state, viewer);
    return {
      ...metrics,
      totalSales: overview.totalSales,
      targetAmount: overview.targetAmount,
      achievedPercent: overview.targetAchievement,
      pipelineValue: overview.totalPipeline,
      openDealsCount: overview.activeDeals,
      wonCount: overview.wonDeals,
    };
  }
  return metrics;
}

export function getPipeline() {
  return getPipelineData(workingState());
}

export function getAttentionDealsList() {
  return getAttentionDeals(workingState());
}

export function search(query: string): SearchResult[] {
  return globalSearch(workingState(), query, 12);
}

export function searchGrouped(query: string) {
  return groupSearchResults(globalSearch(workingState(), query, 100));
}

export function getTeamPerformance() {
  const scoped = workingState();
  return scoped.users
    .filter((u) => u.role === "salesperson")
    .map((user) => {
      const target =
        scoped.salesTargets.find((t) => t.userId === user.id)?.targetAmount ?? 0;
      const revenue = scoped.deals
        .filter((d) => d.ownerId === user.id && d.stage === "won")
        .reduce((sum, d) => sum + d.value, 0);
      const deals = scoped.deals.filter((d) => d.ownerId === user.id).length;
      return { name: user.name, deals, revenue, target: target || 1 };
    });
}

export function getRevenueChartData() {
  const metrics = getDashboardMetrics();
  const months = ["Apr", "May", "Jun", "Jul", "Aug", "Sep"];
  return months.map((month, i) => ({
    month,
    revenue: Math.round(metrics.totalSales * (0.5 + i * 0.1)),
    target: Math.round(metrics.targetAmount / 6),
  }));
}

export function getSalesTeamOverview() {
  return buildSalesTeamOverview(state);
}

export function getSalesTeamRows() {
  return buildSalesTeamRows(state);
}

export function getSalespersonDetail(userId: string) {
  const viewer = getCurrentUser();
  if (!viewer) return undefined;
  if (viewer.role === "admin") return buildSalespersonDetail(state, userId);
  if (viewer.role === "sales_manager" && canViewManagedMember(viewer, userId, state)) {
    return buildSalespersonDetail(state, userId);
  }
  if (viewer.id === userId) return buildSalespersonDetail(state, userId);
  return undefined;
}

export function getMyTeamRows() {
  const viewer = getCurrentUser();
  if (!viewer || viewer.role !== "sales_manager") return [];
  return buildMyTeamRows(state, viewer);
}

export function getMyTeamOverview() {
  const viewer = getCurrentUser();
  if (!viewer || viewer.role !== "sales_manager") {
    return {
      totalSalespeople: 0,
      totalSales: 0,
      totalPipeline: 0,
      targetAmount: 0,
      targetAchievement: 0,
      remaining: 0,
      wonDeals: 0,
      lostDeals: 0,
      activeDeals: 0,
      closedDeals: 0,
      winRate: 0,
      followUpCompletion: 0,
    };
  }
  return buildMyTeamOverview(state, viewer);
}

export function getManagerDashboardData() {
  const viewer = getCurrentUser();
  if (!viewer || viewer.role !== "sales_manager") return null;
  return buildManagerDashboardData(state, viewer);
}

export function getTeamMember360Data(memberId: string) {
  const viewer = getCurrentUser();
  if (!viewer || viewer.role !== "sales_manager") return null;
  return buildTeamMember360Data(state, viewer.id, memberId);
}

export function getManagerRows() {
  const viewer = getCurrentUser();
  if (!userHasPermission(viewer, "USER_VIEW")) return [];
  return buildManagerRows(state);
}

export function getManagerDetail(managerId: string) {
  const viewer = getCurrentUser();
  if (!userHasPermission(viewer, "USER_VIEW")) return undefined;
  return buildManagerDetail(state, managerId);
}

export function searchSalespeopleForTeamRequest(query: string) {
  const viewer = getCurrentUser();
  if (!viewer || viewer.role !== "sales_manager") return [];
  return searchTeamRequestCandidates(state, viewer, query);
}

export function getTeamRequestsForManager() {
  const viewer = getCurrentUser();
  if (!viewer) return [];
  if (viewer.role === "admin" && userHasPermission(viewer, "TEAM_REQUEST_APPROVE")) {
    return state.teamRequests
      .map((item) => toTeamRequestView(state, item))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  if (viewer.role !== "sales_manager") return [];
  return filterRequestsForManager(state.teamRequests, viewer.id)
    .map((item) => toTeamRequestView(state, item))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getPendingTeamRequest(salespersonId: string, type: TeamRequestType = "add") {
  const viewer = getCurrentUser();
  if (!viewer || viewer.role !== "sales_manager") return undefined;
  const request = state.teamRequests.find(
    (item) =>
      item.salespersonId === salespersonId &&
      item.managerId === viewer.id &&
      (item.type ?? "add") === type &&
      item.status === "pending"
  );
  return request ? toTeamRequestView(state, request) : undefined;
}

export function createTeamRequest(
  salespersonId: string,
  type: TeamRequestType = "add"
): TeamRequest {
  const viewer = getCurrentUser();
  if (!viewer || viewer.role !== "sales_manager" || !userHasPermission(viewer, "TEAM_REQUEST_CREATE")) {
    throw new Error("Only managers can request salespeople for their team");
  }
  const salesperson = getUserById(state, salespersonId);
  if (!salesperson) throw new Error("Salesperson not found");
  const check = getTeamRequestEligibility(state, viewer, salesperson, type);
  if (check.eligibility !== "eligible") {
    throw new Error(check.message ?? "This salesperson cannot be requested");
  }
  if (hasPendingTeamRequest(state, salespersonId, viewer.id, type)) {
    throw new Error(
      type === "remove"
        ? TEAM_REQUEST_MESSAGES.pending_remove
        : TEAM_REQUEST_MESSAGES.pending_add
    );
  }

  const request: TeamRequest = {
    id: generateId("tr"),
    type,
    salespersonId: salesperson.id,
    managerId: viewer.id,
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  setState((s) =>
    withAuditEntries(
      {
        ...s,
        teamRequests: [request, ...s.teamRequests],
      },
      [
        {
          action: "created",
          entityType: "team_request",
          entityId: request.id,
          newValue: {
            type,
            salespersonId: salesperson.id,
            managerId: viewer.id,
            status: "pending",
          },
          metadata: {
            requestType: type,
            salespersonName: salesperson.name,
            managerName: viewer.name,
          },
        },
      ]
    )
  );
  return request;
}

export function cancelTeamRequest(id: string) {
  const viewer = getCurrentUser();
  if (!viewer || viewer.role !== "sales_manager") {
    throw new Error("Only managers can cancel their team requests");
  }
  const existing = state.teamRequests.find((item) => item.id === id);
  if (!existing) throw new Error("Request not found");
  if (existing.managerId !== viewer.id) {
    throw new Error("You can only cancel your own requests");
  }
  if (existing.status !== "pending") {
    throw new Error("Only pending requests can be cancelled");
  }
  setState((s) => ({
    ...s,
    teamRequests: s.teamRequests.filter((item) => item.id !== id),
  }));
}

function markRequestRejected(id: string, reviewerId: string, rejectionReason: string): TeamRequest {
  const existing = state.teamRequests.find((item) => item.id === id);
  let updated!: TeamRequest;
  setState((s) =>
    withAuditEntries(
      {
        ...s,
        teamRequests: s.teamRequests.map((item) => {
          if (item.id !== id) return item;
          updated = {
            ...item,
            type: item.type ?? "add",
            status: "rejected",
            reviewedAt: new Date().toISOString(),
            reviewedBy: reviewerId,
            rejectionReason,
          };
          return updated;
        }),
      },
      existing
        ? [
            {
              actorId: reviewerId,
              action: "rejected",
              entityType: "team_request",
              entityId: id,
              previousValue: { status: existing.status },
              newValue: { status: "rejected", reason: rejectionReason },
              metadata: { requestType: existing.type ?? "add" },
            },
          ]
        : []
    )
  );
  return updated;
}

export function approveTeamRequest(id: string): TeamRequest {
  const viewer = getCurrentUser();
  if (!viewer || !userHasPermission(viewer, "TEAM_REQUEST_APPROVE")) {
    throw new Error("Only administrators can approve team requests");
  }
  const existing = state.teamRequests.find((item) => item.id === id);
  if (!existing) throw new Error("Request not found");
  if (existing.status !== "pending") {
    throw new Error("Only pending requests can be approved");
  }
  const manager = getUserById(state, existing.managerId);
  if (!manager || manager.role !== "sales_manager") {
    throw new Error("Requesting manager is not valid");
  }
  const salesperson = getUserById(state, existing.salespersonId);
  if (!salesperson || salesperson.role !== "salesperson") {
    throw new Error("Salesperson is not valid");
  }

  const type = existing.type ?? "add";
  if (type === "add") {
    if (salesperson.managerId && salesperson.managerId !== manager.id) {
      return markRequestRejected(id, viewer.id, TEAM_REQUEST_MESSAGES.stale);
    }
  } else if (salesperson.managerId !== manager.id) {
    return markRequestRejected(id, viewer.id, TEAM_REQUEST_MESSAGES.stale);
  }

  let updated!: TeamRequest;
  const reviewedAt = new Date().toISOString();
  setState((s) =>
    withAuditEntries(
      {
        ...s,
        users: s.users.map((user) => {
          if (user.id !== salesperson.id) return user;
          if (type === "add") {
            return {
              ...user,
              managerId: manager.id,
              team: manager.team,
              lastActive: reviewedAt,
            };
          }
          const next = { ...user, lastActive: reviewedAt };
          delete next.managerId;
          delete next.team;
          return next;
        }),
        teamRequests: s.teamRequests.map((item) => {
          if (item.id !== id) return item;
          updated = {
            ...item,
            type,
            status: "approved",
            reviewedAt,
            reviewedBy: viewer.id,
          };
          return updated;
        }),
      },
      [
        {
          action: "approved",
          entityType: "team_request",
          entityId: id,
          previousValue: { status: "pending" },
          newValue: { status: "approved", type },
          metadata: {
            requestType: type,
            salespersonName: salesperson.name,
            managerName: manager.name,
          },
        },
        type === "add"
          ? {
              action: "assigned",
              entityType: "user",
              entityId: salesperson.id,
              previousValue: { managerId: salesperson.managerId, team: salesperson.team },
              newValue: { managerId: manager.id, team: manager.team },
              metadata: { managerName: manager.name, name: salesperson.name },
            }
          : {
              action: "unassigned",
              entityType: "user",
              entityId: salesperson.id,
              previousValue: { managerId: salesperson.managerId, team: salesperson.team },
              newValue: { managerId: undefined, team: undefined },
              metadata: { managerName: manager.name, name: salesperson.name },
            },
      ]
    )
  );
  return updated;
}

export function rejectTeamRequest(id: string, rejectionReason?: string): TeamRequest {
  const viewer = getCurrentUser();
  if (!viewer || !userHasPermission(viewer, "TEAM_REQUEST_REJECT")) {
    throw new Error("Only administrators can reject team requests");
  }
  const existing = state.teamRequests.find((item) => item.id === id);
  if (!existing) throw new Error("Request not found");
  if (existing.status !== "pending") {
    throw new Error("Only pending requests can be rejected");
  }
  return markRequestRejected(
    id,
    viewer.id,
    rejectionReason?.trim() || "Request rejected"
  );
}

// --- Audit Logs ---

export function getAuditLogs(): AuditLog[] {
  const viewer = getCurrentUser();
  if (!userHasPermission(viewer, "AUDIT_LOG_VIEW")) return [];
  return state.auditLogs;
}

export function getAuditLogById(id: string) {
  const viewer = getCurrentUser();
  if (!userHasPermission(viewer, "AUDIT_LOG_VIEW")) return undefined;
  const log = state.auditLogs.find((item) => item.id === id);
  return log ? toAuditLogView(state, log) : undefined;
}

export function getAuditLogViews() {
  return getAuditLogs().map((log) => toAuditLogView(state, log));
}

export function getAuditLogSummary() {
  const logs = getAuditLogs();
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - 7);
  return {
    total: logs.length,
    today: logs.filter((item) => new Date(item.timestamp) >= startOfToday).length,
    thisWeek: logs.filter((item) => new Date(item.timestamp) >= startOfWeek).length,
    important: logs.filter((item) => IMPORTANT_AUDIT_ACTIONS.includes(item.action)).length,
  };
}

export function recordLoginAudit() {
  const viewer = getCurrentUser();
  if (!viewer) return;
  setState((s) =>
    withAuditEntries(s, [
      {
        action: "login",
        entityType: "system",
        entityId: viewer.id,
        metadata: { role: viewer.role, email: getAccountByUserId(s, viewer.id)?.email ?? viewer.email },
      },
    ])
  );
}

function systemAuditActorId(s: CRMState): string {
  return s.users.find((user) => user.role === "admin")?.id ?? "system";
}

function recordLoginFailedAudit(email: string, reason: string, actorId?: string) {
  setState((s) =>
    withAuditEntries(s, [
      {
        actorId: actorId ?? systemAuditActorId(s),
        action: "login_failed",
        entityType: "user_account",
        entityId: email,
        metadata: { reason },
      },
    ])
  );
}

export function authenticateSignIn(
  email: string,
  password: string,
  portalRole?: User["role"] | null
) {
  const normalizedEmail = normalizeSignInEmail(email);
  if (!password.trim()) {
    return { ok: false as const, error: "Password is required" };
  }

  const account = getAccountByEmail(state, normalizedEmail);
  if (!account) {
    recordLoginFailedAudit(normalizedEmail, "unknown_email");
    return { ok: false as const, error: "Invalid email or password." };
  }

  if (!accountCanSignIn(account)) {
    recordLoginFailedAudit(normalizedEmail, "account_not_active", account.userId);
    return { ok: false as const, error: "This account is not active. Contact your administrator." };
  }

  if (!verifyMockPassword(password, account.mockPasswordHash)) {
    recordLoginFailedAudit(normalizedEmail, "invalid_password", account.userId);
    return { ok: false as const, error: "Invalid email or password." };
  }

  const user = getUserById(state, account.userId);
  if (!user || user.status !== "active") {
    recordLoginFailedAudit(normalizedEmail, "profile_inactive", account.userId);
    return { ok: false as const, error: "This account is not active. Contact your administrator." };
  }

  if (portalRole && isAccountRole(portalRole) && portalRole !== account.role) {
    recordLoginFailedAudit(normalizedEmail, "portal_role_mismatch", account.userId);
    return {
      ok: false as const,
      error: `This account cannot sign in to the selected ${getAccountRoleLabel(portalRole)} portal. Your account role is ${getAccountRoleLabel(account.role)}.`,
    };
  }

  const now = new Date().toISOString();
  setState((s) => ({
    ...s,
    currentUserId: user.id,
    userAccounts: s.userAccounts.map((item) =>
      item.id === account.id ? { ...item, lastLoginAt: now, updatedAt: now } : item
    ),
  }));
  recordLoginAudit();

  return {
    ok: true as const,
    user,
    session: {
      userId: user.id,
      email: account.email,
      name: user.name,
      role: account.role,
      organizationId: account.organizationId,
      managerId: user.managerId,
      team: user.team,
    },
  };
}

export function getUserAccountForProfile(userId: string) {
  return getAccountByUserId(state, userId);
}

export function checkSignInEmailAvailable(email: string, excludeUserId?: string) {
  return isSignInEmailAvailable(state, email, excludeUserId);
}

export function changeUserAccountPassword(userId: string, newPassword: string) {
  const viewer = getCurrentUser();
  const account = getAccountByUserId(state, userId);
  if (!account) throw new Error("Sign-in account not found");
  if (viewer && viewer.role !== "admin" && viewer.id !== userId) {
    throw new Error("You cannot change this password");
  }
  if (!newPassword.trim()) throw new Error("Password is required");

  setState((s) =>
    withAuditEntries(
      {
        ...s,
        userAccounts: s.userAccounts.map((item) =>
          item.id === account.id
            ? {
                ...item,
                mockPasswordHash: mockHashPassword(newPassword),
                updatedAt: new Date().toISOString(),
              }
            : item
        ),
      },
      [
        {
          action: "account_updated",
          entityType: "user_account",
          entityId: account.id,
          metadata: { profileId: userId, field: "password" },
        },
      ]
    )
  );
}

export function disableUserAccountByProfileId(userId: string) {
  const account = getAccountByUserId(state, userId);
  if (!account) throw new Error("Sign-in account not found");
  setState((s) =>
    withAuditEntries(
      {
        ...s,
        userAccounts: s.userAccounts.map((item) =>
          item.id === account.id
            ? { ...item, status: "disabled", updatedAt: new Date().toISOString() }
            : item
        ),
      },
      [
        {
          action: "account_disabled",
          entityType: "user_account",
          entityId: account.id,
          metadata: { profileId: userId, email: account.email },
        },
      ]
    )
  );
}

export function enableUserAccountByProfileId(userId: string) {
  const account = getAccountByUserId(state, userId);
  if (!account) throw new Error("Sign-in account not found");
  setState((s) =>
    withAuditEntries(
      {
        ...s,
        userAccounts: s.userAccounts.map((item) =>
          item.id === account.id
            ? { ...item, status: "active", updatedAt: new Date().toISOString() }
            : item
        ),
      },
      [
        {
          action: "account_enabled",
          entityType: "user_account",
          entityId: account.id,
          metadata: { profileId: userId, email: account.email },
        },
      ]
    )
  );
}

export function recordPasswordResetRequested(email: string) {
  const normalized = normalizeSignInEmail(email);
  setState((s) =>
    withAuditEntries(s, [
      {
        actorId: systemAuditActorId(s),
        action: "password_reset_requested",
        entityType: "user_account",
        entityId: normalized || "unknown",
        metadata: { requested: true },
      },
    ])
  );
}

function requireSettingsManage() {
  const viewer = getCurrentUser();
  if (!viewer || !userHasPermission(viewer, "SETTINGS_MANAGE")) {
    throw new Error(
      "Only administrators with organization settings access can perform this action"
    );
  }
}

const organizationApi = createOrganizationStore({
  getState: () => state,
  setState,
  withAuditEntries,
  requireSettingsManage,
});

export const {
  getOrganization,
  updateOrganizationProfile,
  uploadOrganizationLogo,
  removeOrganizationLogo,
  updateRegionalSettings,
  updateBusinessRules,
  createOrganizationTeam,
  renameOrganizationTeam,
  setOrganizationTeamStatus,
  createSalesRegion,
  renameSalesRegion,
  setSalesRegionStatus,
  updatePipelineStage,
  reorderPipelineStages,
  updatePOStatusConfig,
  getOrganizationTeams,
  getActiveOrganizationTeams,
  getOrganizationTeamMemberCount,
  getPipelineStageConfigs,
  getActivePipelineStageConfigs,
  getPipelineStageLabels,
  getPOStatusConfigs,
  assertActiveTeamName,
} = organizationApi;

export const {
  getTargetSummaryView,
  getSalespersonTargets,
  getTeamTargets,
  getTargetHistory,
  createSalesTarget,
  updateSalesTarget,
  archiveSalesTarget,
  getActiveSalesTargets,
  getDefaultPeriod,
} = targetApi;

export function getManagerTeamTargetRows() {
  const viewer = getCurrentUser();
  if (!viewer || viewer.role !== "sales_manager") return [];
  return buildManagerTeamTargetRows(state, viewer);
}

export function getManagerTeamTargetSummary() {
  const viewer = getCurrentUser();
  if (!viewer || viewer.role !== "sales_manager") {
    return {
      organizationTarget: 0,
      achievedSales: 0,
      remaining: 0,
      achievementPercent: 0,
      activeTargets: 0,
      teamMemberCount: 0,
    };
  }
  return buildManagerTeamTargetSummary(state, viewer);
}

export function getSalespersonOwnTargetRows() {
  const viewer = getCurrentUser();
  if (!viewer || viewer.role !== "salesperson") return [];
  return buildSalespersonOwnTargetRows(state, viewer);
}

export function getSalespersonOwnTargetSummary() {
  const viewer = getCurrentUser();
  if (!viewer || viewer.role !== "salesperson") {
    return {
      organizationTarget: 0,
      achievedSales: 0,
      remaining: 0,
      achievementPercent: 0,
      activeTargets: 0,
    };
  }
  return buildSalespersonOwnTargetSummary(state, viewer);
}

export const {
  previewDataImport,
  exportEntityCsv,
  confirmDataImport,
} = dataManagementApi;

export const {
  getEmailIntegrations,
  getEmailIntegration,
  getEmailIntegrationSummaryView,
  getEmailSyncRuns,
  getEmailSyncStatus,
  connectEmailProvider,
  disconnectEmailIntegration,
  reconnectEmailIntegration,
  updateEmailIntegration,
  syncEmailIntegration,
} = emailIntegrationApi;

export function recordLogoutAudit(userId: string) {
  if (!userId) return;
  setState((s) =>
    withAuditEntries(s, [
      {
        actorId: userId,
        action: "logout",
        entityType: "system",
        entityId: userId,
      },
    ])
  );
}
