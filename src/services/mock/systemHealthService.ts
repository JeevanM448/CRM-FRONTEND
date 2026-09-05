import { delay } from "@/store/storage";
import * as store from "@/store/crmStore";
import type { HealthHistoryFilters } from "@/store/systemHealth";

export async function getSystemHealth() {
  await delay();
  return store.getSystemHealth();
}

export async function getHealthServices() {
  await delay();
  return store.getHealthServices();
}

export async function getHealthService(id: string) {
  await delay();
  return store.getHealthService(id);
}

export async function getHealthHistory(serviceId?: string, filters?: HealthHistoryFilters) {
  await delay();
  return store.getHealthHistory(serviceId, filters);
}

export async function checkHealth(id: string) {
  await delay(300);
  return store.checkHealth(id);
}

export async function getIncidents() {
  await delay();
  return store.getIncidents();
}

export async function getSystemHealthStatus() {
  await delay();
  return store.getSystemHealthStatus();
}
