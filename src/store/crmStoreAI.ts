import type { CreateAuditLogInput } from "./auditLogs";
import type {
  AIConfiguration,
  AICapabilityDefinition,
  AIExecutionFilters,
  AIExecutionRecord,
  AIProviderDefinition,
  AIModelDefinition,
  AIStatusSummary,
  AIUsageFilters,
  AIUsageSummary,
  RunCapabilityInput,
} from "./ai";
import {
  AI_MODEL_REGISTRY,
  AI_PROVIDERS,
  buildAIStatusSummary,
  buildAIUsageSummary,
  buildMockAIResult,
  createAIExecutionFromRun,
  createDefaultAIConfiguration,
  getCapabilityById,
  normalizeAIConfiguration,
  normalizeAICapability,
  normalizeAIExecution,
  DEFAULT_AI_CAPABILITIES,
} from "./ai";
import type { CRMState } from "./types";
import { generateId } from "./storage";

export type AIStoreApi = {
  getState: () => CRMState;
  setState: (updater: (prev: CRMState) => CRMState) => void;
  withAuditEntries: (s: CRMState, entries: CreateAuditLogInput[]) => CRMState;
  requireAIView: () => void;
  requireAIManage: () => void;
  requireAIExecute: () => void;
  requireAIApprove: () => void;
  pushNotification: (notification: {
    title: string;
    message: string;
    severity: "info" | "warning" | "critical" | "success";
    href?: string;
    entityType?: string;
    entityId?: string;
  }) => void;
};

function sortExecutions(executions: AIExecutionRecord[]) {
  return [...executions].sort(
    (a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()
  );
}

export function createAIStore(api: AIStoreApi) {
  function getConfiguration(): AIConfiguration {
    api.requireAIView();
    return normalizeAIConfiguration(api.getState().aiConfiguration);
  }

  function getProviders(): AIProviderDefinition[] {
    api.requireAIView();
    const config = getConfiguration();
    return AI_PROVIDERS.map((provider) => ({
      ...provider,
      status: config.providerStatus,
      credentialStatus: "backend_required",
    }));
  }

  function getModels(): AIModelDefinition[] {
    api.requireAIView();
    return AI_MODEL_REGISTRY;
  }

  function getCapabilities(): AICapabilityDefinition[] {
    api.requireAIView();
    return api.getState().aiCapabilities.map((c) => normalizeAICapability(c));
  }

  function getCapability(id: string): AICapabilityDefinition {
    api.requireAIView();
    const capability = getCapabilityById(id, api.getState().aiCapabilities);
    if (!capability) throw new Error("AI capability not found");
    return normalizeAICapability(capability);
  }

  function updateConfiguration(data: Partial<AIConfiguration>): AIConfiguration {
    api.requireAIManage();
    let updated!: AIConfiguration;
    api.setState((s) => {
      const current = normalizeAIConfiguration(s.aiConfiguration);
      updated = normalizeAIConfiguration({
        ...current,
        ...data,
        updatedAt: new Date().toISOString(),
        updatedBy: s.currentUserId,
      });
      return api.withAuditEntries(
        { ...s, aiConfiguration: updated },
        [
          {
            action: "updated",
            entityType: "ai_configuration",
            entityId: updated.id,
            previousValue: {
              enabled: current.enabled,
              provider: current.provider,
              defaultModel: current.defaultModel,
            },
            newValue: {
              enabled: updated.enabled,
              provider: updated.provider,
              defaultModel: updated.defaultModel,
            },
            metadata: { mockMode: true },
          },
        ]
      );
    });
    return updated;
  }

  function updateCapability(id: string, data: Partial<AICapabilityDefinition>): AICapabilityDefinition {
    api.requireAIManage();
    let updated!: AICapabilityDefinition;
    api.setState((s) => {
      const existing = s.aiCapabilities.find((c) => c.id === id);
      if (!existing) throw new Error("AI capability not found");
      updated = normalizeAICapability({ ...existing, ...data });
      return api.withAuditEntries(
        {
          ...s,
          aiCapabilities: s.aiCapabilities.map((c) => (c.id === id ? updated : c)),
        },
        [
          {
            action: data.enabled === false ? "deactivated" : data.enabled === true ? "activated" : "updated",
            entityType: "ai_capability",
            entityId: id,
            newValue: {
              enabled: updated.enabled,
              modelId: updated.modelId,
              confidenceThreshold: updated.confidenceThreshold,
              approvalPolicy: updated.approvalPolicy,
            },
            metadata: { mockMode: true },
          },
        ]
      );
    });
    return updated;
  }

  function getExecutions(filters?: AIExecutionFilters): AIExecutionRecord[] {
    api.requireAIView();
    let executions = sortExecutions(api.getState().aiExecutions.map((e) => normalizeAIExecution(e)));
    if (filters?.status && filters.status !== "all") {
      executions = executions.filter((e) => e.status === filters.status);
    }
    if (filters?.capability) {
      executions = executions.filter((e) => e.capability === filters.capability);
    }
    if (filters?.search?.trim()) {
      const q = filters.search.trim().toLowerCase();
      executions = executions.filter((e) =>
        [e.id, e.capability, e.sourceType, e.sourceId, e.resultSummary ?? ""]
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    }
    return executions;
  }

  function getExecution(id: string): AIExecutionRecord {
    api.requireAIView();
    const execution = api.getState().aiExecutions.find((e) => e.id === id);
    if (!execution) throw new Error("AI execution not found");
    return normalizeAIExecution(execution);
  }

  function getUsage(filters?: AIUsageFilters): AIUsageSummary {
    api.requireAIView();
    return buildAIUsageSummary(api.getState().aiExecutions, filters);
  }

  function getAIStatus(): AIStatusSummary {
    api.requireAIView();
    const state = api.getState();
    return buildAIStatusSummary(state.aiConfiguration, state.aiCapabilities, state.aiExecutions);
  }

  function runCapability(input: RunCapabilityInput): AIExecutionRecord {
    api.requireAIExecute();
    const state = api.getState();
    const config = normalizeAIConfiguration(state.aiConfiguration);
    if (!config.enabled) throw new Error("AI is disabled for this organization");
    const capability = getCapabilityById(input.capabilityId, state.aiCapabilities);
    if (!capability) throw new Error("AI capability not found");
    if (!capability.enabled) throw new Error("This AI capability is disabled");

    const result = buildMockAIResult(input.capabilityId, {
      failed: input.simulateFailure,
      confidence: input.simulateLowConfidence ? 0.55 : undefined,
    });
    const execution = createAIExecutionFromRun({ capability, config, input, result });

    api.setState((s) =>
      api.withAuditEntries(
        {
          ...s,
          aiExecutions: [execution, ...s.aiExecutions],
        },
        [
          {
            action: "created",
            entityType: "ai_execution",
            entityId: execution.id,
            newValue: { status: execution.status, capability: execution.capability },
            metadata: { mockMode: true, event: "ai_execution_started" },
          },
          ...(execution.status === "succeeded"
            ? [
                {
                  action: "updated" as const,
                  entityType: "ai_execution" as const,
                  entityId: execution.id,
                  metadata: { mockMode: true, event: "ai_execution_completed" },
                },
              ]
            : []),
          ...(execution.status === "failed"
            ? [
                {
                  action: "updated" as const,
                  entityType: "ai_execution" as const,
                  entityId: execution.id,
                  metadata: { mockMode: true, event: "ai_execution_failed" },
                },
              ]
            : []),
          ...(execution.status === "waiting_approval"
            ? [
                {
                  action: "created" as const,
                  entityType: "ai_execution" as const,
                  entityId: execution.id,
                  metadata: { mockMode: true, event: "ai_approval_requested" },
                },
              ]
            : []),
        ]
      )
    );

    if (execution.status === "failed") {
      api.pushNotification({
        title: "AI execution failed",
        message: `${capability.name} — ${execution.errorMessage ?? "Execution failed"}`,
        severity: "critical",
        href: "/ai",
        entityType: "ai_execution",
        entityId: execution.id,
      });
    }
    if (execution.status === "waiting_approval") {
      api.pushNotification({
        title: "AI approval required",
        message: `${capability.name} requires review before continuing`,
        severity: "warning",
        href: "/ai",
        entityType: "ai_execution",
        entityId: execution.id,
      });
    }

    return execution;
  }

  function retryExecution(executionId: string): AIExecutionRecord {
    api.requireAIExecute();
    const original = getExecution(executionId);
    if (original.status !== "failed") throw new Error("Only failed AI executions can be retried");
    const retry = runCapability({
      capabilityId: original.capability,
      sourceType: original.sourceType,
      sourceId: original.sourceId,
      automationExecutionId: original.automationExecutionId,
    });
    const retried = normalizeAIExecution({
      ...retry,
      metadata: { ...retry.metadata, retryOf: executionId, retryCount: 1 },
    });
    api.setState((s) =>
      api.withAuditEntries(
        {
          ...s,
          aiExecutions: s.aiExecutions.map((e) => (e.id === retry.id ? retried : e)),
        },
        [
          {
            action: "updated",
            entityType: "ai_execution",
            entityId: executionId,
            metadata: { mockMode: true, event: "ai_execution_retried", newExecutionId: retried.id },
          },
        ]
      )
    );
    return retried;
  }

  function approveExecution(executionId: string): AIExecutionRecord {
    api.requireAIApprove();
    let updated!: AIExecutionRecord;
    api.setState((s) => {
      const existing = s.aiExecutions.find((e) => e.id === executionId);
      if (!existing) throw new Error("AI execution not found");
      if (existing.status !== "waiting_approval") {
        throw new Error("AI execution is not waiting for approval");
      }
      const now = new Date().toISOString();
      updated = normalizeAIExecution({
        ...existing,
        status: "succeeded",
        approvalStatus: "approved",
        completedAt: now,
        resultSummary: `${existing.resultSummary ?? "AI result"} — approved (mock)`,
      });
      return api.withAuditEntries(
        {
          ...s,
          aiExecutions: s.aiExecutions.map((e) => (e.id === executionId ? updated : e)),
        },
        [
          {
            action: "approved",
            entityType: "ai_execution",
            entityId: executionId,
            metadata: { mockMode: true },
          },
        ]
      );
    });
    return updated;
  }

  function rejectExecution(executionId: string, reason?: string): AIExecutionRecord {
    api.requireAIApprove();
    let updated!: AIExecutionRecord;
    api.setState((s) => {
      const existing = s.aiExecutions.find((e) => e.id === executionId);
      if (!existing) throw new Error("AI execution not found");
      if (existing.status !== "waiting_approval") {
        throw new Error("AI execution is not waiting for approval");
      }
      const now = new Date().toISOString();
      updated = normalizeAIExecution({
        ...existing,
        status: "cancelled",
        approvalStatus: "rejected",
        completedAt: now,
        errorMessage: reason ?? "Rejected by approver",
        resultSummary: "AI result rejected (mock)",
      });
      return api.withAuditEntries(
        {
          ...s,
          aiExecutions: s.aiExecutions.map((e) => (e.id === executionId ? updated : e)),
        },
        [
          {
            action: "rejected",
            entityType: "ai_execution",
            entityId: executionId,
            metadata: { mockMode: true, reason },
          },
        ]
      );
    });
    return updated;
  }

  return {
    getConfiguration,
    updateConfiguration,
    getProviders,
    getModels,
    getCapabilities,
    getCapability,
    updateCapability,
    getExecutions,
    getExecution,
    getUsage,
    getAIStatus,
    runCapability,
    retryExecution,
    approveExecution,
    rejectExecution,
  };
}

export { DEFAULT_AI_CAPABILITIES, createDefaultAIConfiguration, seedAIExecutions } from "./ai";
