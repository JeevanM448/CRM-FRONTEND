export const STORAGE_NAMESPACE = "shiny-stone-sales-os";
export const STORAGE_VERSION = 17;

export const STORAGE_KEYS = {
  version: `${STORAGE_NAMESPACE}-version`,
  customers: `${STORAGE_NAMESPACE}-customers`,
  contacts: `${STORAGE_NAMESPACE}-contacts`,
  deals: `${STORAGE_NAMESPACE}-deals`,
  emails: `${STORAGE_NAMESPACE}-emails`,
  purchaseOrders: `${STORAGE_NAMESPACE}-purchase-orders`,
  followUps: `${STORAGE_NAMESPACE}-follow-ups`,
  workflows: `${STORAGE_NAMESPACE}-workflows`,
  automationExecutions: `${STORAGE_NAMESPACE}-automation-executions`,
  aiConfiguration: `${STORAGE_NAMESPACE}-ai-configuration`,
  aiCapabilities: `${STORAGE_NAMESPACE}-ai-capabilities`,
  aiExecutions: `${STORAGE_NAMESPACE}-ai-executions`,
  documents: `${STORAGE_NAMESPACE}-documents`,
  documentVersions: `${STORAGE_NAMESPACE}-document-versions`,
  documentProcessing: `${STORAGE_NAMESPACE}-document-processing`,
  healthServices: `${STORAGE_NAMESPACE}-health-services`,
  healthCheckHistory: `${STORAGE_NAMESPACE}-health-check-history`,
  systemIncidents: `${STORAGE_NAMESPACE}-system-incidents`,
  backups: `${STORAGE_NAMESPACE}-backups`,
  recoveryPoints: `${STORAGE_NAMESPACE}-recovery-points`,
  backupRetentionPolicy: `${STORAGE_NAMESPACE}-backup-retention-policy`,
  users: `${STORAGE_NAMESPACE}-users`,
  userAccounts: `${STORAGE_NAMESPACE}-user-accounts`,
  notifications: `${STORAGE_NAMESPACE}-notifications`,
  activities: `${STORAGE_NAMESPACE}-activities`,
  salesTargets: `${STORAGE_NAMESPACE}-sales-targets`,
  targetHistory: `${STORAGE_NAMESPACE}-target-history`,
  teamRequests: `${STORAGE_NAMESPACE}-team-requests`,
  auditLogs: `${STORAGE_NAMESPACE}-audit-logs`,
  emailIntegrations: `${STORAGE_NAMESPACE}-email-integrations`,
  emailSyncRuns: `${STORAGE_NAMESPACE}-email-sync-runs`,
  rolePermissions: `${STORAGE_NAMESPACE}-role-permissions`,
  organization: `${STORAGE_NAMESPACE}-organization`,
  organizationLogoBlobs: `${STORAGE_NAMESPACE}-organization-logo-blobs`,
  settings: `${STORAGE_NAMESPACE}-settings`,
  currentUserId: `${STORAGE_NAMESPACE}-current-user-id`,
} as const;

export type StorageKey = keyof typeof STORAGE_KEYS;

export function isBrowser() {
  return typeof window !== "undefined";
}

export function loadFromStorage<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveToStorage<T>(key: string, data: T): void {
  if (!isBrowser()) return;
  localStorage.setItem(key, JSON.stringify(data));
}

export function removeFromStorage(key: string): void {
  if (!isBrowser()) return;
  localStorage.removeItem(key);
}

export function clearAllStorage(): void {
  if (!isBrowser()) return;
  Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
}

export function exportAllStorage(): Record<string, unknown> {
  if (!isBrowser()) return {};
  const result: Record<string, unknown> = {};
  Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
    const raw = localStorage.getItem(key);
    if (raw) {
      try {
        result[name] = JSON.parse(raw);
      } catch {
        result[name] = raw;
      }
    }
  });
  return result;
}

export function delay(ms = 150): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function generateId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}
