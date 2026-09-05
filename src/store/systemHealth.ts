import { generateId } from "./storage";

export type HealthStatusId = "HEALTHY" | "DEGRADED" | "DOWN" | "UNKNOWN" | "NOT_CONFIGURED";

export type HealthCategory =
  | "APPLICATION"
  | "DATABASE"
  | "AUTH"
  | "STORAGE"
  | "EMAIL"
  | "AI"
  | "AUTOMATION"
  | "NOTIFICATIONS"
  | "WORKERS"
  | "API";

export type IncidentSeverity = "INFO" | "WARNING" | "ERROR" | "CRITICAL";
export type IncidentStatus = "OPEN" | "ACKNOWLEDGED" | "RESOLVED";

export interface SystemHealthServiceStatus {
  id: string;
  name: string;
  category: HealthCategory;
  status: HealthStatusId;
  description: string;
  lastCheckedAt: string;
  latencyMs?: number;
  version?: string;
  environment: string;
  details?: string;
  errorCode?: string;
  dependencies?: string[];
  metadata?: Record<string, unknown>;
}

export interface SystemHealthSummary {
  overallStatus: HealthStatusId;
  healthyCount: number;
  degradedCount: number;
  downCount: number;
  unknownCount: number;
  lastUpdatedAt: string;
}

export interface HealthCheckRecord {
  id: string;
  serviceId: string;
  status: HealthStatusId;
  checkedAt: string;
  latencyMs?: number;
  message?: string;
  errorCode?: string;
  metadata?: Record<string, unknown>;
}

export interface SystemIncidentRecord {
  id: string;
  serviceId: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  title: string;
  description: string;
  startedAt: string;
  resolvedAt?: string;
  acknowledgedBy?: string;
  metadata?: Record<string, unknown>;
}

export interface HealthHistoryFilters {
  serviceId?: string;
  status?: HealthStatusId | "all";
  category?: HealthCategory | "all";
  dateFrom?: string;
  dateTo?: string;
}

export const HEALTH_STATUS_LABELS: Record<HealthStatusId, string> = {
  HEALTHY: "Healthy",
  DEGRADED: "Degraded",
  DOWN: "Down",
  UNKNOWN: "Unknown",
  NOT_CONFIGURED: "Not Configured",
};

export const HEALTH_CATEGORY_LABELS: Record<HealthCategory, string> = {
  APPLICATION: "Application",
  DATABASE: "Database",
  AUTH: "Authentication",
  STORAGE: "Storage",
  EMAIL: "Email",
  AI: "AI",
  AUTOMATION: "Automation",
  NOTIFICATIONS: "Notifications",
  WORKERS: "Background Workers",
  API: "API",
};

const ENV = "mock-development";

export const DEFAULT_HEALTH_SERVICES: SystemHealthServiceStatus[] = [
  {
    id: "svc-application",
    name: "Application",
    category: "APPLICATION",
    status: "HEALTHY",
    description: "Next.js frontend application runtime (mock status)",
    lastCheckedAt: "2026-09-01T08:00:00Z",
    latencyMs: 12,
    version: "0.1.0",
    environment: ENV,
    details: "Mock health — no live infrastructure probe",
    metadata: { mockMode: true },
  },
  {
    id: "svc-database",
    name: "Database",
    category: "DATABASE",
    status: "NOT_CONFIGURED",
    description: "Supabase PostgreSQL — backend connection required",
    lastCheckedAt: "2026-09-01T08:00:00Z",
    environment: ENV,
    details: "Using localStorage in mock mode",
    dependencies: ["API"],
    metadata: { mockMode: true },
  },
  {
    id: "svc-auth",
    name: "Authentication",
    category: "AUTH",
    status: "DEGRADED",
    description: "Mock session auth — Supabase Auth not connected",
    lastCheckedAt: "2026-09-01T08:00:00Z",
    latencyMs: 8,
    environment: ENV,
    dependencies: ["API", "DATABASE"],
    metadata: { mockMode: true },
  },
  {
    id: "svc-storage",
    name: "Storage",
    category: "STORAGE",
    status: "NOT_CONFIGURED",
    description: "Supabase Storage — private bucket not provisioned",
    lastCheckedAt: "2026-09-01T08:00:00Z",
    environment: ENV,
    dependencies: ["API", "DATABASE"],
    metadata: { mockMode: true },
  },
  {
    id: "svc-email",
    name: "Email Integrations",
    category: "EMAIL",
    status: "NOT_CONFIGURED",
    description: "Gmail/Outlook OAuth — backend connection required",
    lastCheckedAt: "2026-09-01T08:00:00Z",
    environment: ENV,
    dependencies: ["API", "AUTH"],
    metadata: { mockMode: true },
  },
  {
    id: "svc-ai",
    name: "AI Services",
    category: "AI",
    status: "NOT_CONFIGURED",
    description: "AI provider calls are mock/backend-contract only",
    lastCheckedAt: "2026-09-01T08:00:00Z",
    environment: ENV,
    dependencies: ["API"],
    metadata: { mockMode: true },
  },
  {
    id: "svc-automation",
    name: "Automation Engine",
    category: "AUTOMATION",
    status: "HEALTHY",
    description: "Workflow engine mock — no background workers",
    lastCheckedAt: "2026-09-01T08:00:00Z",
    latencyMs: 24,
    environment: ENV,
    dependencies: ["DATABASE", "WORKERS", "NOTIFICATIONS"],
    metadata: { mockMode: true },
  },
  {
    id: "svc-notifications",
    name: "Notifications",
    category: "NOTIFICATIONS",
    status: "HEALTHY",
    description: "In-app notification system (mock)",
    lastCheckedAt: "2026-09-01T08:00:00Z",
    latencyMs: 5,
    environment: ENV,
    metadata: { mockMode: true },
  },
  {
    id: "svc-workers",
    name: "Background Workers",
    category: "WORKERS",
    status: "NOT_CONFIGURED",
    description: "Job queue/workers — not implemented",
    lastCheckedAt: "2026-09-01T08:00:00Z",
    environment: ENV,
    dependencies: ["API", "DATABASE"],
    metadata: { mockMode: true },
  },
  {
    id: "svc-api",
    name: "API / Backend",
    category: "API",
    status: "NOT_CONFIGURED",
    description: "Secure backend API — not connected",
    lastCheckedAt: "2026-09-01T08:00:00Z",
    environment: ENV,
    metadata: { mockMode: true },
  },
];

export const seedHealthCheckHistory: HealthCheckRecord[] = [
  {
    id: "hchk-1",
    serviceId: "svc-application",
    status: "HEALTHY",
    checkedAt: "2026-09-01T07:55:00Z",
    latencyMs: 11,
    message: "Mock check passed",
    metadata: { mockMode: true },
  },
  {
    id: "hchk-2",
    serviceId: "svc-auth",
    status: "DEGRADED",
    checkedAt: "2026-09-01T07:55:00Z",
    latencyMs: 9,
    message: "Mock auth using local session only",
    metadata: { mockMode: true },
  },
  {
    id: "hchk-3",
    serviceId: "svc-database",
    status: "NOT_CONFIGURED",
    checkedAt: "2026-09-01T07:50:00Z",
    message: "Backend database not connected",
    metadata: { mockMode: true },
  },
];

export const seedSystemIncidents: SystemIncidentRecord[] = [
  {
    id: "inc-1",
    serviceId: "svc-auth",
    severity: "WARNING",
    status: "OPEN",
    title: "Supabase Auth not configured",
    description: "Authentication is running in mock mode. Production requires Supabase Auth.",
    startedAt: "2026-08-28T10:00:00Z",
    metadata: { mockMode: true },
  },
  {
    id: "inc-2",
    serviceId: "svc-api",
    severity: "INFO",
    status: "ACKNOWLEDGED",
    title: "Backend API pending integration",
    description: "Frontend service contracts are ready; backend implementation is planned.",
    startedAt: "2026-08-20T09:00:00Z",
    acknowledgedBy: "user-1",
    metadata: { mockMode: true },
  },
];

export function buildSystemHealthSummary(services: SystemHealthServiceStatus[]): SystemHealthSummary {
  const healthyCount = services.filter((s) => s.status === "HEALTHY").length;
  const degradedCount = services.filter((s) => s.status === "DEGRADED").length;
  const downCount = services.filter((s) => s.status === "DOWN").length;
  const unknownCount = services.filter(
    (s) => s.status === "UNKNOWN" || s.status === "NOT_CONFIGURED"
  ).length;

  let overallStatus: HealthStatusId = "HEALTHY";
  if (downCount > 0) overallStatus = "DOWN";
  else if (degradedCount > 0) overallStatus = "DEGRADED";
  else if (healthyCount === 0) overallStatus = "UNKNOWN";

  const lastUpdatedAt = services.reduce((latest, svc) => {
    const t = new Date(svc.lastCheckedAt).getTime();
    return t > new Date(latest).getTime() ? svc.lastCheckedAt : latest;
  }, services[0]?.lastCheckedAt ?? new Date().toISOString());

  return {
    overallStatus,
    healthyCount,
    degradedCount,
    downCount,
    unknownCount,
    lastUpdatedAt,
  };
}

export function filterHealthHistory(
  records: HealthCheckRecord[],
  filters?: HealthHistoryFilters,
  services?: SystemHealthServiceStatus[]
) {
  let results = [...records];
  if (filters?.serviceId) {
    results = results.filter((r) => r.serviceId === filters.serviceId);
  }
  if (filters?.status && filters.status !== "all") {
    results = results.filter((r) => r.status === filters.status);
  }
  if (filters?.category && filters.category !== "all" && services) {
    const ids = services.filter((s) => s.category === filters.category).map((s) => s.id);
    results = results.filter((r) => ids.includes(r.serviceId));
  }
  if (filters?.dateFrom) {
    const from = new Date(filters.dateFrom).getTime();
    results = results.filter((r) => new Date(r.checkedAt).getTime() >= from);
  }
  if (filters?.dateTo) {
    const to = new Date(filters.dateTo).getTime();
    results = results.filter((r) => new Date(r.checkedAt).getTime() <= to);
  }
  return results.sort((a, b) => new Date(b.checkedAt).getTime() - new Date(a.checkedAt).getTime());
}

export function simulateHealthCheck(service: SystemHealthServiceStatus): {
  service: SystemHealthServiceStatus;
  record: HealthCheckRecord;
} {
  const now = new Date().toISOString();
  const latencyMs = Math.floor(Math.random() * 40) + 5;

  let status = service.status;
  if (service.status === "NOT_CONFIGURED") {
    status = "NOT_CONFIGURED";
  } else if (service.id === "svc-auth") {
    status = "DEGRADED";
  } else {
    status = "HEALTHY";
  }

  const updated: SystemHealthServiceStatus = {
    ...service,
    status,
    lastCheckedAt: now,
    latencyMs,
    metadata: { ...service.metadata, mockMode: true, lastMockCheck: now },
  };

  const record: HealthCheckRecord = {
    id: generateId("hchk"),
    serviceId: service.id,
    status,
    checkedAt: now,
    latencyMs,
    message: `Mock health check — ${HEALTH_STATUS_LABELS[status]}`,
    metadata: { mockMode: true, simulated: true },
  };

  return { service: updated, record };
}

export function createDefaultHealthServices() {
  return DEFAULT_HEALTH_SERVICES.map((s) => ({ ...s }));
}
