import { delay } from "@/store/storage";
import * as store from "@/store/crmStore";
import type { AuditLogService } from "../interfaces";

export async function getAll() {
  await delay();
  return store.getAuditLogViews();
}

export async function getById(id: string) {
  await delay();
  const log = store.getAuditLogById(id);
  if (!log) throw new Error("Audit log not found");
  return log;
}

export async function getSummary() {
  await delay();
  return store.getAuditLogSummary();
}

export class MockAuditLogService implements AuditLogService {
  getAll = getAll;
  getById = getById;
  getSummary = getSummary;
}
