import type { CreateAuditLogInput } from "./auditLogs";
import type { CRMState } from "./types";
import {
  buildSystemHealthSummary,
  filterHealthHistory,
  simulateHealthCheck,
  type HealthCheckRecord,
  type HealthHistoryFilters,
  type SystemHealthServiceStatus,
  type SystemHealthSummary,
  type SystemIncidentRecord,
} from "./systemHealth";

export type SystemHealthStoreApi = {
  getState: () => CRMState;
  setState: (updater: (prev: CRMState) => CRMState) => void;
  withAuditEntries: (s: CRMState, entries: CreateAuditLogInput[]) => CRMState;
  requireSystemHealthView: () => void;
  requireSystemHealthManage: () => void;
  pushNotification: (notification: {
    title: string;
    message: string;
    severity: "info" | "warning" | "critical" | "success";
    href?: string;
    entityType?: string;
    entityId?: string;
  }) => void;
};

export function createSystemHealthStore(api: SystemHealthStoreApi) {
  function getHealthServices(): SystemHealthServiceStatus[] {
    api.requireSystemHealthView();
    return api.getState().healthServices;
  }

  function getHealthService(id: string): SystemHealthServiceStatus {
    api.requireSystemHealthView();
    const service = api.getState().healthServices.find((s) => s.id === id);
    if (!service) throw new Error("Health service not found");
    return service;
  }

  function getSystemHealth(): SystemHealthSummary {
    api.requireSystemHealthView();
    return buildSystemHealthSummary(api.getState().healthServices);
  }

  function getSystemHealthStatus(): SystemHealthSummary {
    return getSystemHealth();
  }

  function getHealthHistory(
    serviceId?: string,
    filters?: HealthHistoryFilters
  ): HealthCheckRecord[] {
    api.requireSystemHealthView();
    const state = api.getState();
    return filterHealthHistory(
      state.healthCheckHistory,
      { ...filters, serviceId: serviceId ?? filters?.serviceId },
      state.healthServices
    );
  }

  function getIncidents(): SystemIncidentRecord[] {
    api.requireSystemHealthView();
    return api.getState().systemIncidents;
  }

  function checkHealth(serviceId: string): SystemHealthServiceStatus {
    api.requireSystemHealthManage();
    const state = api.getState();
    const existing = state.healthServices.find((s) => s.id === serviceId);
    if (!existing) throw new Error("Health service not found");

    const previousStatus = existing.status;
    const { service: updated, record } = simulateHealthCheck(existing);

    let updatedState!: CRMState;
    api.setState((s) => {
      updatedState = api.withAuditEntries(
        {
          ...s,
          healthServices: s.healthServices.map((svc) => (svc.id === serviceId ? updated : svc)),
          healthCheckHistory: [record, ...s.healthCheckHistory].slice(0, 200),
        },
        [
          {
            action: "updated",
            entityType: "system_health",
            entityId: serviceId,
            metadata: {
              mockMode: true,
              event: "SYSTEM_HEALTH_CHECKED",
              status: updated.status,
            },
          },
        ]
      );
      return updatedState;
    });

    if (updated.status === "DOWN" && previousStatus !== "DOWN") {
      api.pushNotification({
        title: "System service down",
        message: `${updated.name} reported down (mock check)`,
        severity: "critical",
        href: "/system-health",
        entityType: "system_health",
        entityId: serviceId,
      });
    } else if (updated.status === "DEGRADED" && previousStatus === "HEALTHY") {
      api.pushNotification({
        title: "System service degraded",
        message: `${updated.name} is degraded (mock check)`,
        severity: "warning",
        href: "/system-health",
        entityType: "system_health",
        entityId: serviceId,
      });
    } else if (updated.status === "HEALTHY" && (previousStatus === "DOWN" || previousStatus === "DEGRADED")) {
      api.pushNotification({
        title: "System service recovered",
        message: `${updated.name} is healthy again (mock check)`,
        severity: "success",
        href: "/system-health",
        entityType: "system_health",
        entityId: serviceId,
      });
    }

    return updated;
  }

  return {
    getHealthServices,
    getHealthService,
    getSystemHealth,
    getSystemHealthStatus,
    getHealthHistory,
    getIncidents,
    checkHealth,
  };
}
