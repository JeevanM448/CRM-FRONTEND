import type { CreateAuditLogInput } from "./auditLogs";
import type {
  AuditValue,
  CRMState,
  EmailIntegrationRecord,
  EmailProvider,
  EmailSyncRunRecord,
} from "./types";
import {
  getEmailIntegrationSummary,
  normalizeEmailIntegration,
  sortSyncRuns,
  type ConnectEmailProviderInput,
  type UpdateEmailIntegrationInput,
} from "./emailIntegrations";
import { generateId } from "./storage";

export type EmailIntegrationStoreApi = {
  getState: () => CRMState;
  setState: (updater: (prev: CRMState) => CRMState) => void;
  withAuditEntries: (s: CRMState, entries: CreateAuditLogInput[]) => CRMState;
  requireEmailIntegrationManage: () => void;
  requireEmailSyncManage: () => void;
  pushNotification: (
    notification: {
      title: string;
      message: string;
      severity: "info" | "warning" | "critical" | "success";
      href?: string;
      entityType?: string;
      entityId?: string;
    }
  ) => void;
};

const MOCK_ACCOUNTS: Record<EmailProvider, { email: string; displayName: string }> = {
  gmail: { email: "sales@shinystone.com", displayName: "Shiny Stone Sales" },
  outlook: { email: "crm@shinystone.com", displayName: "Shiny Stone CRM" },
};

function findActiveProvider(
  integrations: EmailIntegrationRecord[],
  provider: EmailProvider,
  excludeId?: string
) {
  return integrations.find(
    (item) => item.provider === provider && item.id !== excludeId && item.status === "connected"
  );
}

export function createEmailIntegrationStore(api: EmailIntegrationStoreApi) {
  function getEmailIntegrations() {
    return api.getState().emailIntegrations;
  }

  function getEmailIntegration(id: string) {
    const integration = api.getState().emailIntegrations.find((item) => item.id === id);
    if (!integration) throw new Error("Email integration not found");
    return integration;
  }

  function getEmailIntegrationSummaryView() {
    return getEmailIntegrationSummary(api.getState().emailIntegrations);
  }

  function getEmailSyncRuns(integrationId: string) {
    return sortSyncRuns(
      api.getState().emailSyncRuns.filter((item) => item.integrationId === integrationId)
    );
  }

  function getEmailSyncStatus(integrationId: string) {
    const integration = getEmailIntegration(integrationId);
    return {
      status: integration.lastSyncStatus,
      lastSyncAt: integration.lastSyncAt,
      lastError: integration.lastSyncError,
    };
  }

  function connectEmailProvider(input: ConnectEmailProviderInput) {
    api.requireEmailIntegrationManage();
    const state = api.getState();
    if (findActiveProvider(state.emailIntegrations, input.provider)) {
      throw new Error(`An active ${input.provider} integration already exists`);
    }

    const existing = state.emailIntegrations.find((item) => item.provider === input.provider);
    const now = new Date().toISOString();
    const account = MOCK_ACCOUNTS[input.provider];

    const integration = normalizeEmailIntegration({
      id: existing?.id ?? generateId("ei"),
      provider: input.provider,
      accountEmail: input.accountEmail || account.email,
      displayName: input.displayName || account.displayName,
      status: "connected",
      connectionType: "oauth",
      connectedAt: now,
      lastSyncStatus: "idle",
      syncEnabled: true,
      syncFrequency: existing?.syncFrequency ?? "1h",
      syncDirection: existing?.syncDirection ?? "two-way",
      historicalSyncDays: existing?.historicalSyncDays ?? 30,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      createdBy: state.currentUserId,
      metadata: {
        ...(existing?.metadata ?? {}),
        mockMode: true,
        aiClassificationEnabled: true,
        automationTriggersEnabled: true,
      },
    });

    api.setState((s) =>
      api.withAuditEntries(
        {
          ...s,
          emailIntegrations: existing
            ? s.emailIntegrations.map((item) => (item.id === existing.id ? integration : item))
            : [...s.emailIntegrations, integration],
        },
        [
          {
            action: existing?.status === "disconnected" ? "reconnected" : "connected",
            entityType: "email_integration",
            entityId: integration.id,
            newValue: {
              provider: integration.provider,
              accountEmail: integration.accountEmail,
              status: integration.status,
            } as AuditValue,
            metadata: { provider: integration.provider, accountEmail: integration.accountEmail },
          },
        ]
      )
    );

    return integration;
  }

  function disconnectEmailIntegration(id: string) {
    api.requireEmailIntegrationManage();
    const existing = getEmailIntegration(id);
    const now = new Date().toISOString();
    const updated: EmailIntegrationRecord = {
      ...existing,
      status: "disconnected",
      syncEnabled: false,
      lastSyncStatus: "idle",
      lastSyncError: undefined,
      updatedAt: now,
    };

    api.setState((s) =>
      api.withAuditEntries(
        {
          ...s,
          emailIntegrations: s.emailIntegrations.map((item) => (item.id === id ? updated : item)),
        },
        [
          {
            action: "disconnected",
            entityType: "email_integration",
            entityId: id,
            previousValue: { status: existing.status } as AuditValue,
            newValue: { status: updated.status } as AuditValue,
            metadata: { provider: existing.provider, accountEmail: existing.accountEmail },
          },
        ]
      )
    );

    api.pushNotification({
      title: "Email integration disconnected",
      message: `${existing.displayName} (${existing.accountEmail}) was disconnected`,
      severity: "warning",
      href: "/email-integrations",
      entityType: "email_integration",
      entityId: id,
    });

    return updated;
  }

  function reconnectEmailIntegration(id: string) {
    api.requireEmailIntegrationManage();
    const existing = getEmailIntegration(id);
    if (findActiveProvider(api.getState().emailIntegrations, existing.provider, id)) {
      throw new Error(`Another active ${existing.provider} integration already exists`);
    }

    const now = new Date().toISOString();
    const updated: EmailIntegrationRecord = {
      ...existing,
      status: "connected",
      connectedAt: now,
      syncEnabled: true,
      lastSyncError: undefined,
      updatedAt: now,
    };

    api.setState((s) =>
      api.withAuditEntries(
        {
          ...s,
          emailIntegrations: s.emailIntegrations.map((item) => (item.id === id ? updated : item)),
        },
        [
          {
            action: "reconnected",
            entityType: "email_integration",
            entityId: id,
            metadata: { provider: existing.provider, accountEmail: existing.accountEmail },
          },
        ]
      )
    );

    return updated;
  }

  function updateEmailIntegration(id: string, input: UpdateEmailIntegrationInput) {
    api.requireEmailIntegrationManage();
    const existing = getEmailIntegration(id);
    const now = new Date().toISOString();
    const updated: EmailIntegrationRecord = {
      ...existing,
      ...input,
      metadata: input.metadata ? { ...existing.metadata, ...input.metadata } : existing.metadata,
      updatedAt: now,
    };

    api.setState((s) =>
      api.withAuditEntries(
        {
          ...s,
          emailIntegrations: s.emailIntegrations.map((item) => (item.id === id ? updated : item)),
        },
        [
          {
            action: "updated",
            entityType: "email_integration",
            entityId: id,
            previousValue: {
              syncEnabled: existing.syncEnabled,
              syncFrequency: existing.syncFrequency,
              syncDirection: existing.syncDirection,
            } as AuditValue,
            newValue: {
              syncEnabled: updated.syncEnabled,
              syncFrequency: updated.syncFrequency,
              syncDirection: updated.syncDirection,
            } as AuditValue,
            metadata: { provider: existing.provider, accountEmail: existing.accountEmail },
          },
        ]
      )
    );

    return updated;
  }

  function syncEmailIntegration(id: string) {
    api.requireEmailSyncManage();
    const existing = getEmailIntegration(id);
    if (existing.status !== "connected") {
      throw new Error("Only connected integrations can be synced");
    }

    const startedAt = new Date().toISOString();
    const runId = generateId("esr");
    const inProgress: EmailSyncRunRecord = {
      id: runId,
      integrationId: id,
      provider: existing.provider,
      syncType: "manual",
      status: "in_progress",
      startedAt,
      messagesProcessed: 0,
      messagesCreated: 0,
      messagesUpdated: 0,
      messagesSkipped: 0,
      errorCount: 0,
    };

    api.setState((s) =>
      api.withAuditEntries(
        {
          ...s,
          emailIntegrations: s.emailIntegrations.map((item) =>
            item.id === id
              ? { ...item, lastSyncStatus: "in_progress", updatedAt: startedAt }
              : item
          ),
          emailSyncRuns: [inProgress, ...s.emailSyncRuns].slice(0, 500),
        },
        [
          {
            action: "updated",
            entityType: "email_integration",
            entityId: id,
            metadata: { syncPhase: "started", provider: existing.provider },
          },
        ]
      )
    );

    const completedAt = new Date().toISOString();
    const processed = 12;
    const created = 2;
    const updatedCount = 3;
    const skipped = 7;
    const completed: EmailSyncRunRecord = {
      ...inProgress,
      status: "success",
      completedAt,
      messagesProcessed: processed,
      messagesCreated: created,
      messagesUpdated: updatedCount,
      messagesSkipped: skipped,
      errorCount: 0,
    };

    api.setState((s) =>
      api.withAuditEntries(
        {
          ...s,
          emailIntegrations: s.emailIntegrations.map((item) =>
            item.id === id
              ? {
                  ...item,
                  lastSyncAt: completedAt,
                  lastSyncStatus: "success",
                  lastSyncError: undefined,
                  updatedAt: completedAt,
                  metadata: {
                    ...item.metadata,
                    linkedCustomersCount: (item.metadata?.linkedCustomersCount ?? 0) + created,
                    linkedDealsCount: (item.metadata?.linkedDealsCount ?? 0) + updatedCount,
                  },
                }
              : item
          ),
          emailSyncRuns: s.emailSyncRuns.map((item) => (item.id === runId ? completed : item)),
        },
        [
          {
            action: "updated",
            entityType: "email_integration",
            entityId: id,
            metadata: {
              syncPhase: "completed",
              provider: existing.provider,
              messagesProcessed: processed,
              messagesCreated: created,
              messagesUpdated: updatedCount,
              messagesSkipped: skipped,
            },
          },
        ]
      )
    );

    return completed;
  }

  return {
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
  };
}
