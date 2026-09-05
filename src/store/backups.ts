import { generateId } from "./storage";
import { formatFileSize } from "./documents";

export type BackupType = "FULL" | "INCREMENTAL" | "SNAPSHOT" | "EXPORT";
export type BackupStatus =
  | "QUEUED"
  | "RUNNING"
  | "COMPLETED"
  | "FAILED"
  | "EXPIRED"
  | "RESTORING";

export type RecoveryScope = "ORGANIZATION" | "DATABASE" | "STORAGE" | "CONFIGURATION";
export type IntegrityStatus = "VERIFIED" | "UNVERIFIED" | "FAILED";
export type BackupFrequency = "DAILY" | "WEEKLY" | "MONTHLY";

export interface BackupRecord {
  id: string;
  organizationId: string;
  type: BackupType;
  status: BackupStatus;
  startedAt: string;
  completedAt?: string;
  sizeBytes: number;
  storageProvider: "mock" | "supabase" | "future_provider";
  storageReference: string;
  checksum?: string;
  createdBy: string;
  retentionUntil?: string;
  encryptionStatus: "ready" | "not_configured";
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}

export interface RecoveryPointRecord {
  id: string;
  backupId: string;
  createdAt: string;
  description: string;
  scope: RecoveryScope;
  sizeBytes: number;
  integrityStatus: IntegrityStatus;
  restorable: boolean;
  metadata?: Record<string, unknown>;
}

export interface BackupRetentionPolicy {
  enabled: boolean;
  retentionDays: number;
  maxRecoveryPoints: number;
  backupFrequency: BackupFrequency;
  backupType: BackupType;
  encryptionRequired: boolean;
  verificationRequired: boolean;
  updatedAt: string;
  updatedBy: string;
}

export interface BackupSecurityReadiness {
  encryption: "ready" | "not_configured";
  integrityVerification: "ready" | "not_configured";
  privateStorage: "ready" | "not_configured";
  accessControl: "ready" | "not_configured";
  auditLogging: "ready" | "not_configured";
}

export interface BackupSummary {
  lastSuccessfulBackupAt?: string;
  backupStatus: BackupStatus | "NONE";
  storageUsedBytes: number;
  recoveryPointCount: number;
  failedBackupCount: number;
}

export const BACKUP_TYPE_LABELS: Record<BackupType, string> = {
  FULL: "Full",
  INCREMENTAL: "Incremental",
  SNAPSHOT: "Snapshot",
  EXPORT: "Export",
};

export const BACKUP_STATUS_LABELS: Record<BackupStatus, string> = {
  QUEUED: "Queued",
  RUNNING: "Running",
  COMPLETED: "Completed",
  FAILED: "Failed",
  EXPIRED: "Expired",
  RESTORING: "Restoring",
};

export const RECOVERY_SCOPE_LABELS: Record<RecoveryScope, string> = {
  ORGANIZATION: "Organization",
  DATABASE: "Database",
  STORAGE: "Storage",
  CONFIGURATION: "Configuration",
};

export function createDefaultRetentionPolicy(userId = "user-1"): BackupRetentionPolicy {
  const now = new Date().toISOString();
  return {
    enabled: true,
    retentionDays: 30,
    maxRecoveryPoints: 10,
    backupFrequency: "DAILY",
    backupType: "FULL",
    encryptionRequired: true,
    verificationRequired: true,
    updatedAt: now,
    updatedBy: userId,
  };
}

export function buildBackupSecurityReadiness(policy: BackupRetentionPolicy): BackupSecurityReadiness {
  return {
    encryption: policy.encryptionRequired ? "not_configured" : "not_configured",
    integrityVerification: policy.verificationRequired ? "not_configured" : "not_configured",
    privateStorage: "not_configured",
    accessControl: "ready",
    auditLogging: "ready",
  };
}

export function buildBackupSummary(
  backups: BackupRecord[],
  recoveryPoints: RecoveryPointRecord[]
): BackupSummary {
  const completed = backups.filter((b) => b.status === "COMPLETED");
  const last = completed.sort(
    (a, b) => new Date(b.completedAt ?? b.startedAt).getTime() - new Date(a.completedAt ?? a.startedAt).getTime()
  )[0];

  const running = backups.find((b) => b.status === "RUNNING" || b.status === "QUEUED");

  return {
    lastSuccessfulBackupAt: last?.completedAt ?? last?.startedAt,
    backupStatus: running?.status ?? (last ? "COMPLETED" : "NONE"),
    storageUsedBytes: completed.reduce((sum, b) => sum + b.sizeBytes, 0),
    recoveryPointCount: recoveryPoints.length,
    failedBackupCount: backups.filter((b) => b.status === "FAILED").length,
  };
}

const orgId = "org-1";

export const seedBackups: BackupRecord[] = [
  {
    id: "bkp-1",
    organizationId: orgId,
    type: "FULL",
    status: "COMPLETED",
    startedAt: "2026-08-31T02:00:00Z",
    completedAt: "2026-08-31T02:05:00Z",
    sizeBytes: 15728640,
    storageProvider: "mock",
    storageReference: "mock://backups/org-1/bkp-1/full.tar.gz",
    checksum: "mock-sha256-bkp-1",
    createdBy: "user-1",
    retentionUntil: "2026-09-30T02:00:00Z",
    encryptionStatus: "not_configured",
    metadata: { mockMode: true, simulated: true },
  },
  {
    id: "bkp-2",
    organizationId: orgId,
    type: "INCREMENTAL",
    status: "COMPLETED",
    startedAt: "2026-09-01T02:00:00Z",
    completedAt: "2026-09-01T02:01:30Z",
    sizeBytes: 2097152,
    storageProvider: "mock",
    storageReference: "mock://backups/org-1/bkp-2/incremental.tar.gz",
    checksum: "mock-sha256-bkp-2",
    createdBy: "user-1",
    retentionUntil: "2026-10-01T02:00:00Z",
    encryptionStatus: "not_configured",
    metadata: { mockMode: true, simulated: true },
  },
  {
    id: "bkp-3",
    organizationId: orgId,
    type: "SNAPSHOT",
    status: "FAILED",
    startedAt: "2026-08-29T02:00:00Z",
    completedAt: "2026-08-29T02:00:45Z",
    sizeBytes: 0,
    storageProvider: "mock",
    storageReference: "mock://backups/org-1/bkp-3/snapshot.tar.gz",
    createdBy: "user-1",
    encryptionStatus: "not_configured",
    errorMessage: "Mock backup failure — backend worker not available",
    metadata: { mockMode: true, simulated: true },
  },
];

export const seedRecoveryPoints: RecoveryPointRecord[] = [
  {
    id: "rp-1",
    backupId: "bkp-1",
    createdAt: "2026-08-31T02:05:00Z",
    description: "Full organization backup — Aug 31 (mock)",
    scope: "ORGANIZATION",
    sizeBytes: 15728640,
    integrityStatus: "UNVERIFIED",
    restorable: true,
    metadata: { mockMode: true },
  },
  {
    id: "rp-2",
    backupId: "bkp-2",
    createdAt: "2026-09-01T02:01:30Z",
    description: "Incremental backup — Sep 1 (mock)",
    scope: "DATABASE",
    sizeBytes: 2097152,
    integrityStatus: "UNVERIFIED",
    restorable: true,
    metadata: { mockMode: true },
  },
];

export function createMockBackup(
  organizationId: string,
  createdBy: string,
  type: BackupType = "FULL"
): BackupRecord {
  const id = generateId("bkp");
  const now = new Date().toISOString();
  return {
    id,
    organizationId,
    type,
    status: "QUEUED",
    startedAt: now,
    sizeBytes: 0,
    storageProvider: "mock",
    storageReference: `mock://backups/${organizationId}/${id}/${type.toLowerCase()}.tar.gz`,
    createdBy,
    encryptionStatus: "not_configured",
    metadata: { mockMode: true, simulated: true },
  };
}

export function completeMockBackup(backup: BackupRecord): {
  backup: BackupRecord;
  recoveryPoint: RecoveryPointRecord;
} {
  const now = new Date().toISOString();
  const sizeBytes = backup.type === "FULL" ? 12582912 : 1048576;
  const completed: BackupRecord = {
    ...backup,
    status: "COMPLETED",
    completedAt: now,
    sizeBytes,
    checksum: `mock-sha256-${backup.id}`,
    retentionUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    metadata: { ...backup.metadata, mockMode: true, simulated: true },
  };

  const recoveryPoint: RecoveryPointRecord = {
    id: generateId("rp"),
    backupId: backup.id,
    createdAt: now,
    description: `${BACKUP_TYPE_LABELS[backup.type]} backup — ${now.slice(0, 10)} (mock)`,
    scope: backup.type === "EXPORT" ? "CONFIGURATION" : "ORGANIZATION",
    sizeBytes,
    integrityStatus: "UNVERIFIED",
    restorable: true,
    metadata: { mockMode: true, simulated: true },
  };

  return { backup: completed, recoveryPoint };
}

export { formatFileSize };
