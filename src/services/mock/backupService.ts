import { delay } from "@/store/storage";
import * as store from "@/store/crmStore";
import type { BackupRetentionPolicy, BackupType } from "@/store/backups";

export async function getBackups() {
  await delay();
  return store.getBackups();
}

export async function getBackup(id: string) {
  await delay();
  return store.getBackup(id);
}

export async function createBackup(type?: BackupType) {
  await delay(400);
  return store.createBackup(type);
}

export async function getRecoveryPoints() {
  await delay();
  return store.getRecoveryPoints();
}

export async function getRecoveryPoint(id: string) {
  await delay();
  return store.getRecoveryPoint(id);
}

export async function simulateRestore(recoveryPointId: string) {
  await delay(500);
  return store.simulateRestore(recoveryPointId);
}

export async function getRetentionPolicy() {
  await delay();
  return store.getRetentionPolicy();
}

export async function updateRetentionPolicy(data: Partial<BackupRetentionPolicy>) {
  await delay();
  return store.updateRetentionPolicy(data);
}

export async function verifyBackup(id: string) {
  await delay();
  return store.verifyBackup(id);
}

export async function getBackupSummary() {
  await delay();
  return store.getBackupSummary();
}

export async function getBackupSecurityReadiness() {
  await delay();
  return store.getBackupSecurityReadiness();
}
