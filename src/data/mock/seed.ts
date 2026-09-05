export {
  mockUsers,
  mockCustomers,
  mockContacts,
  mockDeals,
  mockActivities,
  mockPurchaseOrders,
  mockFollowUps,
  mockEmailThreads,
  mockWorkflows,
} from "../mock/index";

import { seedAutomationExecutions, normalizeWorkflow } from "@/store/automation";
import {
  createDefaultAIConfiguration,
  DEFAULT_AI_CAPABILITIES,
  seedAIExecutions,
} from "@/store/ai";
import {
  seedDocuments,
  seedDocumentProcessing,
  seedDocumentVersions,
} from "@/store/documents";
import {
  createDefaultHealthServices,
  seedHealthCheckHistory,
  seedSystemIncidents,
} from "@/store/systemHealth";
import {
  createDefaultRetentionPolicy,
  seedBackups,
  seedRecoveryPoints,
} from "@/store/backups";
import { createDefaultRolePermissions } from "@/lib/auth/permissions";
import { createDefaultOrganizationState } from "@/store/organization";
import { normalizeSalesTarget } from "@/store/targets";
import type { AppNotification, CRMState, SalesTargetRecord } from "@/store/types";
import { defaultSettings } from "@/store/types";
import { createSeedAccounts } from "../mock/seedAccounts";
import { seedAuditLogs } from "../mock/auditLogs";
import {
  mockUsers,
  mockCustomers,
  mockContacts,
  mockDeals,
  mockActivities,
  mockPurchaseOrders,
  mockFollowUps,
  mockEmailThreads,
  mockWorkflows,
} from "../mock/index";
import {
  salesTeamDemoActivities,
  salesTeamDemoContacts,
  salesTeamDemoCustomers,
  salesTeamDemoDeals,
  salesTeamDemoFollowUps,
  salesTeamDemoPurchaseOrders,
  salesTeamDemoTargets,
  salesTeamDemoUsers,
} from "../mock/salesTeamDemo";

export const seedNotifications: AppNotification[] = [
  {
    id: "notif-1",
    userId: "user-1",
    title: "New email received",
    message: "ABC Corporation requested a revised quotation",
    type: "email",
    severity: "info",
    read: false,
    timestamp: "2026-09-01T05:12:00Z",
    href: "/inbox",
    entityType: "email",
    entityId: "email-1",
  },
  {
    id: "notif-2",
    userId: "user-1",
    title: "Follow-up overdue",
    message: "Send updated pricing sheet for Global Industries",
    type: "follow-up",
    severity: "warning",
    read: false,
    timestamp: "2026-08-30T10:00:00Z",
    href: "/follow-ups",
    entityType: "follow_up",
    entityId: "fu-1",
  },
  {
    id: "notif-3",
    userId: "user-1",
    title: "PO pending approval",
    message: "PO-10245 awaiting review",
    type: "po",
    severity: "warning",
    read: true,
    timestamp: "2026-08-29T11:00:00Z",
    href: "/purchase-orders/po-1",
    entityType: "purchase_order",
    entityId: "po-1",
  },
];

const now = "2026-09-01T00:00:00Z";

export const seedSalesTargets: SalesTargetRecord[] = [
  normalizeSalesTarget({
    id: "st-1",
    userId: "user-2",
    period: "2026-Q3",
    targetAmount: 5000000,
    achievedAmount: 4200000,
    createdAt: now,
    updatedAt: now,
  }),
  normalizeSalesTarget({
    id: "st-2",
    userId: "user-3",
    period: "2026-Q3",
    targetAmount: 4000000,
    achievedAmount: 3040000,
    createdAt: now,
    updatedAt: now,
  }),
  normalizeSalesTarget({
    id: "st-3",
    userId: "user-1",
    period: "2026-Q3",
    targetAmount: 10000000,
    achievedAmount: 7240000,
    createdAt: now,
    updatedAt: now,
  }),
  ...salesTeamDemoTargets.map((target) =>
    normalizeSalesTarget({
      ...target,
      createdAt: now,
      updatedAt: now,
    })
  ),
];

export function createSeedState(): CRMState {
  const users = [...mockUsers, ...salesTeamDemoUsers];
  return {
    customers: [...mockCustomers, ...salesTeamDemoCustomers],
    contacts: [...mockContacts, ...salesTeamDemoContacts],
    deals: [...mockDeals, ...salesTeamDemoDeals],
    emails: mockEmailThreads,
    purchaseOrders: [...mockPurchaseOrders, ...salesTeamDemoPurchaseOrders],
    followUps: [...mockFollowUps, ...salesTeamDemoFollowUps],
    workflows: mockWorkflows.map((workflow) => normalizeWorkflow(workflow)),
    automationExecutions: seedAutomationExecutions,
    aiConfiguration: createDefaultAIConfiguration("user-1"),
    aiCapabilities: DEFAULT_AI_CAPABILITIES.map((capability) => ({ ...capability })),
    aiExecutions: seedAIExecutions,
    documents: seedDocuments,
    documentVersions: seedDocumentVersions,
    documentProcessing: seedDocumentProcessing,
    healthServices: createDefaultHealthServices(),
    healthCheckHistory: seedHealthCheckHistory,
    systemIncidents: seedSystemIncidents,
    backups: seedBackups,
    recoveryPoints: seedRecoveryPoints,
    backupRetentionPolicy: createDefaultRetentionPolicy("user-1"),
    users,
    userAccounts: createSeedAccounts(users),
    notifications: seedNotifications,
    activities: [...mockActivities, ...salesTeamDemoActivities],
    salesTargets: seedSalesTargets,
    targetHistory: [],
    teamRequests: [],
    auditLogs: seedAuditLogs,
    emailIntegrations: [],
    emailSyncRuns: [],
    rolePermissions: createDefaultRolePermissions(),
    organization: createDefaultOrganizationState(),
    settings: defaultSettings,
    currentUserId: "user-1",
  };
}
