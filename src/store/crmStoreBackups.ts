import type { CreateAuditLogInput } from "./auditLogs";
import type { CRMState } from "./types";
import {
  buildBackupSecurityReadiness,
  buildBackupSummary,
  completeMockBackup,
  createMockBackup,
  type BackupRecord,
  type BackupRetentionPolicy,
  type BackupSecurityReadiness,
  type BackupSummary,
  type BackupType,
  type RecoveryPointRecord,
} from "./backups";

export type BackupsStoreApi = {
  getState: () => CRMState;
  setState: (updater: (prev: CRMState) => CRMState) => void;
  withAuditEntries: (s: CRMState, entries: CreateAuditLogInput[]) => CRMState;
  requireBackupView: () => void;
  requireBackupManage: () => void;
  requireBackupRestore: () => void;
  pushNotification: (notification: {
    title: string;
    message: string;
    severity: "info" | "warning" | "critical" | "success";
    href?: string;
    entityType?: string;
    entityId?: string;
  }) => void;
};

export function createBackupsStore(api: BackupsStoreApi) {
  function getBackups(): BackupRecord[] {
    api.requireBackupView();
    return [...api.getState().backups].sort(
      (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );
  }

  function getBackup(id: string): BackupRecord {
    api.requireBackupView();
    const backup = api.getState().backups.find((b) => b.id === id);
    if (!backup) throw new Error("Backup not found");
    return backup;
  }

  function getRecoveryPoints(): RecoveryPointRecord[] {
    api.requireBackupView();
    return [...api.getState().recoveryPoints].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  function getRecoveryPoint(id: string): RecoveryPointRecord {
    api.requireBackupView();
    const point = api.getState().recoveryPoints.find((p) => p.id === id);
    if (!point) throw new Error("Recovery point not found");
    return point;
  }

  function getRetentionPolicy(): BackupRetentionPolicy {
    api.requireBackupView();
    return api.getState().backupRetentionPolicy;
  }

  function getBackupSummary(): BackupSummary {
    api.requireBackupView();
    const state = api.getState();
    return buildBackupSummary(state.backups, state.recoveryPoints);
  }

  function getBackupSecurityReadiness(): BackupSecurityReadiness {
    api.requireBackupView();
    return buildBackupSecurityReadiness(api.getState().backupRetentionPolicy);
  }

  function createBackup(type?: BackupType): BackupRecord {
    api.requireBackupManage();
    const state = api.getState();
    const policy = state.backupRetentionPolicy;
    const backup = createMockBackup(
      state.organization.settings.id,
      state.currentUserId,
      type ?? policy.backupType
    );

    api.setState((s) =>
      api.withAuditEntries(
        {
          ...s,
          backups: [backup, ...s.backups],
        },
        [
          {
            action: "created",
            entityType: "backup",
            entityId: backup.id,
            metadata: { mockMode: true, event: "BACKUP_CREATED", type: backup.type },
          },
        ]
      )
    );

    const running: BackupRecord = { ...backup, status: "RUNNING" };
    api.setState((s) => ({
      ...s,
      backups: s.backups.map((b) => (b.id === backup.id ? running : b)),
    }));

    const { backup: completed, recoveryPoint } = completeMockBackup(running);
    api.setState((s) =>
      api.withAuditEntries(
        {
          ...s,
          backups: s.backups.map((b) => (b.id === backup.id ? completed : b)),
          recoveryPoints: [recoveryPoint, ...s.recoveryPoints].slice(0, s.backupRetentionPolicy.maxRecoveryPoints),
        },
        [
          {
            action: "updated",
            entityType: "backup",
            entityId: backup.id,
            metadata: { mockMode: true, event: "BACKUP_COMPLETED" },
          },
        ]
      )
    );

    api.pushNotification({
      title: "Backup completed",
      message: `Mock ${completed.type} backup finished (simulation only)`,
      severity: "success",
      href: "/backup-recovery",
      entityType: "backup",
      entityId: completed.id,
    });

    return completed;
  }

  function updateRetentionPolicy(data: Partial<BackupRetentionPolicy>): BackupRetentionPolicy {
    api.requireBackupManage();
    let updated!: BackupRetentionPolicy;
    api.setState((s) => {
      updated = {
        ...s.backupRetentionPolicy,
        ...data,
        updatedAt: new Date().toISOString(),
        updatedBy: s.currentUserId,
      };
      return api.withAuditEntries(
        { ...s, backupRetentionPolicy: updated },
        [
          {
            action: "updated",
            entityType: "backup",
            entityId: "retention-policy",
            metadata: { mockMode: true, event: "BACKUP_POLICY_UPDATED" },
          },
        ]
      );
    });
    return updated;
  }

  function verifyBackup(id: string): BackupRecord {
    api.requireBackupManage();
    const backup = getBackup(id);
    if (backup.status !== "COMPLETED") throw new Error("Only completed backups can be verified");

    let updated!: BackupRecord;
    api.setState((s) => {
      updated = {
        ...backup,
        metadata: { ...backup.metadata, verifiedAt: new Date().toISOString(), mockVerified: true },
      };
      return api.withAuditEntries(
        {
          ...s,
          backups: s.backups.map((b) => (b.id === id ? updated : b)),
          recoveryPoints: s.recoveryPoints.map((rp) =>
            rp.backupId === id ? { ...rp, integrityStatus: "VERIFIED" as const } : rp
          ),
        },
        [
          {
            action: "updated",
            entityType: "backup",
            entityId: id,
            metadata: { mockMode: true, event: "BACKUP_VERIFIED" },
          },
        ]
      );
    });
    return updated;
  }

  function simulateRestore(recoveryPointId: string): { success: boolean; message: string } {
    api.requireBackupRestore();
    const point = getRecoveryPoint(recoveryPointId);
    if (!point.restorable) throw new Error("Recovery point is not restorable");

    api.setState((s) =>
      api.withAuditEntries(s, [
        {
          action: "updated",
          entityType: "backup",
          entityId: point.backupId,
          metadata: {
            mockMode: true,
            event: "BACKUP_RESTORE_SIMULATED",
            recoveryPointId,
            simulated: true,
          },
        },
      ])
    );

    api.pushNotification({
      title: "Restore simulation completed",
      message: `Mock restore for ${point.description} — no data was changed`,
      severity: "info",
      href: "/backup-recovery",
      entityType: "backup",
      entityId: point.backupId,
    });

    return {
      success: true,
      message: "Restore simulation completed successfully. No production data was modified.",
    };
  }

  return {
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
  };
}
