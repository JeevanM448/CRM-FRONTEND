import type {
  EmailIntegrationRecord,
  EmailProvider,
  EmailSyncDirection,
  EmailSyncFrequency,
  EmailSyncRunRecord,
} from "./types";

export type {
  EmailProvider,
  EmailConnectionType,
  EmailIntegrationStatus,
  EmailSyncDirection,
  EmailSyncFrequency,
  EmailSyncStatus,
  EmailIntegrationRecord,
  EmailSyncRunRecord,
  EmailSyncRunStatus,
} from "./types";

export const EMAIL_PROVIDER_LABELS: Record<EmailProvider, string> = {
  gmail: "Gmail",
  outlook: "Microsoft Outlook",
};

export const EMAIL_SYNC_FREQUENCY_LABELS: Record<EmailSyncFrequency, string> = {
  "15m": "Every 15 minutes",
  "30m": "Every 30 minutes",
  "1h": "Hourly",
  "6h": "Every 6 hours",
  "24h": "Daily",
  manual: "Manual only",
};

export const EMAIL_SYNC_DIRECTION_LABELS: Record<EmailSyncDirection, string> = {
  inbound: "Inbound only",
  outbound: "Outbound only",
  "two-way": "Two-way sync",
};

export const EMAIL_AUTOMATION_TRIGGERS = [
  "EMAIL_RECEIVED",
  "EMAIL_SENT",
  "EMAIL_REPLIED",
  "EMAIL_CLASSIFIED",
  "EMAIL_LINKED_TO_DEAL",
  "EMAIL_REQUIRES_FOLLOWUP",
] as const;

export type EmailAutomationTrigger = (typeof EMAIL_AUTOMATION_TRIGGERS)[number];

export interface EmailIntegrationSummary {
  connectedCount: number;
  gmailCount: number;
  outlookCount: number;
  syncIssueCount: number;
}

export interface ConnectEmailProviderInput {
  provider: EmailProvider;
  accountEmail: string;
  displayName: string;
}

export interface UpdateEmailIntegrationInput {
  syncEnabled?: boolean;
  syncFrequency?: EmailSyncFrequency;
  syncDirection?: EmailSyncDirection;
  historicalSyncDays?: number;
  displayName?: string;
  metadata?: EmailIntegrationRecord["metadata"];
}

export function getEmailIntegrationSummary(
  integrations: EmailIntegrationRecord[]
): EmailIntegrationSummary {
  const connected = integrations.filter((item) => item.status === "connected");
  return {
    connectedCount: connected.length,
    gmailCount: connected.filter((item) => item.provider === "gmail").length,
    outlookCount: connected.filter((item) => item.provider === "outlook").length,
    syncIssueCount: integrations.filter(
      (item) =>
        item.status === "error" ||
        item.lastSyncStatus === "failed" ||
        (item.syncEnabled && item.status === "connected" && !item.lastSyncAt)
    ).length,
  };
}

export function sortSyncRuns(runs: EmailSyncRunRecord[]): EmailSyncRunRecord[] {
  return [...runs].sort(
    (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
  );
}

export function normalizeEmailIntegration(
  integration: Partial<EmailIntegrationRecord> &
    Pick<EmailIntegrationRecord, "id" | "provider" | "accountEmail" | "displayName" | "createdBy">
): EmailIntegrationRecord {
  const now = new Date().toISOString();
  return {
    id: integration.id,
    provider: integration.provider,
    accountEmail: integration.accountEmail,
    displayName: integration.displayName,
    status: integration.status ?? "disconnected",
    connectionType: integration.connectionType ?? "oauth",
    connectedAt: integration.connectedAt,
    lastSyncAt: integration.lastSyncAt,
    lastSyncStatus: integration.lastSyncStatus ?? "idle",
    lastSyncError: integration.lastSyncError,
    syncEnabled: integration.syncEnabled ?? true,
    syncFrequency: integration.syncFrequency ?? "1h",
    syncDirection: integration.syncDirection ?? "two-way",
    historicalSyncDays: integration.historicalSyncDays ?? 30,
    createdAt: integration.createdAt ?? now,
    updatedAt: integration.updatedAt ?? now,
    createdBy: integration.createdBy,
    metadata: integration.metadata ?? {
      aiClassificationEnabled: true,
      automationTriggersEnabled: true,
    },
  };
}
