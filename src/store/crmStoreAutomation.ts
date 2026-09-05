import type { AutomationWorkflow } from "@/types";
import type { CreateAuditLogInput } from "./auditLogs";
import type { AutomationExecutionRecord, CRMState } from "./types";
import {
  AUTOMATION_ACTIONS,
  buildWorkflowSummary,
  getActionLabel,
  getTriggerLabel,
  normalizeExecution,
  normalizeWorkflow,
  validateWorkflowData,
  type WorkflowValidationResult,
} from "./automation";
import type { CreateWorkflowInput } from "./helpers";
import { generateId } from "./storage";

export type AutomationStoreApi = {
  getState: () => CRMState;
  setState: (updater: (prev: CRMState) => CRMState) => void;
  withAuditEntries: (s: CRMState, entries: CreateAuditLogInput[]) => CRMState;
  requireAutomationView: () => void;
  requireAutomationManage: () => void;
  requireAutomationExecute: () => void;
  requireAutomationApprove: () => void;
  pushNotification: (notification: {
    title: string;
    message: string;
    severity: "info" | "warning" | "critical" | "success";
    href?: string;
    entityType?: string;
    entityId?: string;
  }) => void;
};

function sortExecutions(executions: AutomationExecutionRecord[]) {
  return [...executions].sort(
    (a, b) => new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime()
  );
}

export function createAutomationStore(api: AutomationStoreApi) {
  function getWorkflows(): AutomationWorkflow[] {
    api.requireAutomationView();
    return api.getState().workflows.map((w) => normalizeWorkflow(w));
  }

  function getWorkflow(id: string): AutomationWorkflow {
    api.requireAutomationView();
    const workflow = api.getState().workflows.find((w) => w.id === id);
    if (!workflow) throw new Error("Workflow not found");
    return normalizeWorkflow(workflow);
  }

  function validateWorkflow(data: Partial<AutomationWorkflow>): WorkflowValidationResult {
    return validateWorkflowData(data);
  }

  function createWorkflow(input: CreateWorkflowInput): AutomationWorkflow {
    api.requireAutomationManage();
    const state = api.getState();
    const now = new Date().toISOString();
    const workflow = normalizeWorkflow({
      id: generateId("wf"),
      name: input.name.trim(),
      description: input.description?.trim() ?? "",
      status: input.status ?? "draft",
      triggerType: input.triggerType ?? "MANUAL",
      conditionLogic: input.conditionLogic ?? "all",
      conditions: input.conditions ?? [],
      actions: input.actions ?? [],
      aiEnabled: input.aiEnabled ?? false,
      aiConfig: input.aiConfig,
      humanApprovalRequired: input.humanApprovalRequired ?? false,
      approvalConfig: input.approvalConfig,
      priority: input.priority ?? "normal",
      schedule: input.schedule,
      metadata: input.metadata,
      steps: input.steps?.map((s, i) => ({ ...s, id: `legacy-${i}` })),
      version: 1,
      createdBy: state.currentUserId,
      createdAt: now,
      updatedAt: now,
      totalRuns: 0,
      successfulRuns: 0,
      failedRuns: 0,
    });

    api.setState((s) =>
      api.withAuditEntries(
        {
          ...s,
          workflows: [...s.workflows, workflow],
        },
        [
          {
            action: "created",
            entityType: "automation",
            entityId: workflow.id,
            newValue: {
              name: workflow.name,
              status: workflow.status,
              triggerType: workflow.triggerType,
            },
            metadata: { mockMode: true },
          },
        ]
      )
    );
    return workflow;
  }

  function updateWorkflow(
    id: string,
    data: Partial<CreateWorkflowInput & { status?: AutomationWorkflow["status"] }>
  ): AutomationWorkflow {
    api.requireAutomationManage();
    let updated!: AutomationWorkflow;
    api.setState((s) => {
      const existing = s.workflows.find((w) => w.id === id);
      if (!existing) throw new Error("Workflow not found");
      const normalized = normalizeWorkflow(existing);
      const nextVersion =
        normalized.status === "active" && Object.keys(data).some((k) => k !== "status")
          ? normalized.version + 1
          : normalized.version;

      const { steps: _legacySteps, ...dataWithoutLegacySteps } = data;
      updated = normalizeWorkflow({
        ...normalized,
        ...dataWithoutLegacySteps,
        name: data.name?.trim() ?? normalized.name,
        description: data.description?.trim() ?? normalized.description,
        conditions: data.conditions ?? normalized.conditions,
        actions: data.actions ?? normalized.actions,
        version: nextVersion,
        updatedAt: new Date().toISOString(),
      });

      return api.withAuditEntries(
        {
          ...s,
          workflows: s.workflows.map((w) => (w.id === id ? updated : w)),
        },
        [
          {
            action: "updated",
            entityType: "automation",
            entityId: id,
            previousValue: { name: normalized.name, status: normalized.status, version: normalized.version },
            newValue: { name: updated.name, status: updated.status, version: updated.version },
            metadata: { mockMode: true },
          },
        ]
      );
    });
    return updated;
  }

  function activateWorkflow(id: string): AutomationWorkflow {
    api.requireAutomationManage();
    const workflow = getWorkflow(id);
    const validation = validateWorkflowData(workflow);
    if (!validation.canActivate) {
      throw new Error(validation.errors.join(". ") || "Workflow cannot be activated");
    }
    const updated = updateWorkflow(id, { status: "active" });
    api.setState((s) =>
      api.withAuditEntries(s, [
        {
          action: "activated",
          entityType: "automation",
          entityId: id,
          metadata: { mockMode: true },
        },
      ])
    );
    return updated;
  }

  function pauseWorkflow(id: string): AutomationWorkflow {
    api.requireAutomationManage();
    const workflow = getWorkflow(id);
    if (workflow.status === "archived") throw new Error("Archived workflows cannot be paused");
    const updated = updateWorkflow(id, { status: "paused" });
    api.setState((s) =>
      api.withAuditEntries(s, [
        {
          action: "deactivated",
          entityType: "automation",
          entityId: id,
          metadata: { action: "paused", mockMode: true },
        },
      ])
    );
    return updated;
  }

  function archiveWorkflow(id: string): AutomationWorkflow {
    api.requireAutomationManage();
    const updated = updateWorkflow(id, { status: "archived" });
    api.setState((s) =>
      api.withAuditEntries(s, [
        {
          action: "deactivated",
          entityType: "automation",
          entityId: id,
          metadata: { action: "archived", mockMode: true },
        },
      ])
    );
    return updated;
  }

  function duplicateWorkflow(id: string): AutomationWorkflow {
    api.requireAutomationManage();
    const source = getWorkflow(id);
    return createWorkflow({
      name: `${source.name} (Copy)`,
      description: source.description,
      status: "draft",
      triggerType: source.triggerType,
      conditionLogic: source.conditionLogic,
      conditions: source.conditions.map((c) => ({ ...c, id: generateId("cond") })),
      actions: source.actions.map((a, index) => ({
        ...a,
        id: generateId("action"),
        order: index,
      })),
      aiEnabled: source.aiEnabled,
      aiConfig: source.aiConfig,
      humanApprovalRequired: source.humanApprovalRequired,
      approvalConfig: source.approvalConfig,
      priority: source.priority,
      schedule: source.schedule,
      metadata: { duplicatedFrom: source.id },
    });
  }

  function getExecutions(workflowId?: string): AutomationExecutionRecord[] {
    api.requireAutomationView();
    const executions = api.getState().automationExecutions;
    const filtered = workflowId
      ? executions.filter((e) => e.workflowId === workflowId)
      : executions;
    return sortExecutions(filtered.map((e) => normalizeExecution(e)));
  }

  function getExecution(id: string): AutomationExecutionRecord {
    api.requireAutomationView();
    const execution = api.getState().automationExecutions.find((e) => e.id === id);
    if (!execution) throw new Error("Execution not found");
    return normalizeExecution(execution);
  }

  function buildMockExecutionSteps(workflow: AutomationWorkflow): AutomationExecutionRecord["steps"] {
    const steps: AutomationExecutionRecord["steps"] = [
      {
        id: generateId("step"),
        name: `Trigger: ${getTriggerLabel(workflow.triggerType)}`,
        type: "trigger",
        status: "succeeded",
        message: "Event matched (mock)",
      },
    ];

    if (workflow.conditions.length > 0) {
      steps.push({
        id: generateId("step"),
        name: "Conditions evaluated",
        type: "condition",
        status: "succeeded",
        message: `${workflow.conditionLogic.toUpperCase()} conditions passed (mock)`,
      });
    }

    const sortedActions = [...workflow.actions].sort((a, b) => a.order - b.order);
    for (const action of sortedActions) {
      const def = AUTOMATION_ACTIONS.find((a) => a.id === action.actionType);
      steps.push({
        id: generateId("step"),
        name: getActionLabel(action.actionType),
        type: "action",
        status: "pending",
        message: def?.aiAction ? "AI action — backend contract only (mock)" : "Pending mock execution",
        metadata: { actionType: action.actionType, parameters: action.parameters },
      });
    }

    if (workflow.humanApprovalRequired) {
      steps.push({
        id: generateId("step"),
        name: "Human approval",
        type: "approval",
        status: "waiting_approval",
        message: `Awaiting ${workflow.approvalConfig?.approverRole ?? "manager"} approval`,
      });
    }

    steps.push({
      id: generateId("step"),
      name: "Result",
      type: "result",
      status: "pending",
    });

    return steps;
  }

  function executeWorkflow(id: string, context?: Record<string, unknown>): AutomationExecutionRecord {
    api.requireAutomationExecute();
    const workflow = getWorkflow(id);
    if (workflow.status !== "active") {
      throw new Error("Only active workflows can be executed");
    }

    const now = new Date().toISOString();
    const steps = buildMockExecutionSteps(workflow);
    const needsApproval = workflow.humanApprovalRequired;
    const simulateFailure = context?.simulateFailure === true;
    const finalStatus: AutomationExecutionRecord["status"] = simulateFailure
      ? "failed"
      : needsApproval
        ? "waiting_approval"
        : "succeeded";

    const completedSteps = steps.map((step, index) => {
      if (simulateFailure && step.type === "action" && index === steps.findIndex((s) => s.type === "action")) {
        return { ...step, status: "failed" as const, message: "Mock execution failure" };
      }
      if (step.type === "result") {
        return {
          ...step,
          status: finalStatus === "succeeded" ? ("succeeded" as const) : ("pending" as const),
          message: finalStatus === "succeeded" ? "Workflow completed (mock)" : undefined,
        };
      }
      if (step.status === "waiting_approval") return step;
      if (step.status === "pending" && (needsApproval || simulateFailure)) return step;
      return { ...step, status: "succeeded" as const, startedAt: now, completedAt: now };
    });

    const execution = normalizeExecution({
      id: generateId("exec"),
      workflowId: workflow.id,
      workflowVersion: workflow.version,
      status: finalStatus,
      triggerType: workflow.triggerType,
      triggeredAt: now,
      startedAt: now,
      completedAt: finalStatus === "succeeded" || finalStatus === "failed" ? now : undefined,
      durationMs: finalStatus === "succeeded" || finalStatus === "failed" ? 1500 : undefined,
      currentStep: completedSteps.filter((s) => s.status === "succeeded").length,
      totalSteps: completedSteps.length,
      retryCount: 0,
      errorMessage: simulateFailure ? "Mock execution failure" : undefined,
      resultSummary: buildWorkflowSummary(workflow),
      steps: completedSteps,
      approvalStatus: needsApproval ? "pending" : undefined,
      metadata: {
        mockMode: true,
        aiEnabled: workflow.aiEnabled,
        context,
      },
    });

    api.setState((s) => {
      const isSuccess = execution.status === "succeeded";
      const isFailed = execution.status === "failed";
      const nextWorkflows = s.workflows.map((w) => {
        if (w.id !== workflow.id) return w;
        const n = normalizeWorkflow(w);
        return normalizeWorkflow({
          ...n,
          lastRunAt: now,
          lastRun: now,
          totalRuns: n.totalRuns + 1,
          successfulRuns: n.successfulRuns + (isSuccess ? 1 : 0),
          failedRuns: n.failedRuns + (isFailed ? 1 : 0),
        });
      });

      return api.withAuditEntries(
        {
          ...s,
          workflows: nextWorkflows,
          automationExecutions: [execution, ...s.automationExecutions],
        },
        [
          {
            action: "created",
            entityType: "automation_execution",
            entityId: execution.id,
            newValue: { status: execution.status, workflowId: workflow.id },
            metadata: { mockMode: true, event: "execution_started" },
          },
          ...(isSuccess
            ? [
                {
                  action: "updated" as const,
                  entityType: "automation_execution" as const,
                  entityId: execution.id,
                  metadata: { mockMode: true, event: "execution_succeeded" },
                },
              ]
            : []),
          ...(isFailed
            ? [
                {
                  action: "updated" as const,
                  entityType: "automation_execution" as const,
                  entityId: execution.id,
                  metadata: { mockMode: true, event: "execution_failed" },
                },
              ]
            : []),
          ...(needsApproval
            ? [
                {
                  action: "created" as const,
                  entityType: "automation_execution" as const,
                  entityId: execution.id,
                  metadata: { mockMode: true, event: "approval_requested" },
                },
              ]
            : []),
        ]
      );
    });

    if (execution.status === "failed") {
      api.pushNotification({
        title: "Automation failed",
        message: `${workflow.name} — ${execution.errorMessage ?? "Execution failed"}`,
        severity: "critical",
        href: "/automation",
        entityType: "automation_execution",
        entityId: execution.id,
      });
    }
    if (execution.status === "waiting_approval") {
      api.pushNotification({
        title: "Automation approval required",
        message: `${workflow.name} is waiting for approval`,
        severity: "warning",
        href: "/automation",
        entityType: "automation_execution",
        entityId: execution.id,
      });
    }

    return execution;
  }

  function retryExecution(executionId: string): AutomationExecutionRecord {
    api.requireAutomationExecute();
    const original = getExecution(executionId);
    if (original.status !== "failed") {
      throw new Error("Only failed executions can be retried");
    }
    const workflow = getWorkflow(original.workflowId);
    const retry = executeWorkflow(workflow.id, { retryOf: executionId });
    const retried = normalizeExecution({
      ...retry,
      retryCount: original.retryCount + 1,
      parentExecutionId: original.id,
      metadata: { ...retry.metadata, retryOf: executionId },
    });

    api.setState((s) =>
      api.withAuditEntries(
        {
          ...s,
          automationExecutions: s.automationExecutions.map((e) =>
            e.id === retry.id ? retried : e
          ),
        },
        [
          {
            action: "updated",
            entityType: "automation_execution",
            entityId: executionId,
            metadata: { mockMode: true, event: "execution_retried", newExecutionId: retried.id },
          },
        ]
      )
    );

    return retried;
  }

  function approveExecution(executionId: string): AutomationExecutionRecord {
    api.requireAutomationApprove();
    let updated!: AutomationExecutionRecord;
    api.setState((s) => {
      const existing = s.automationExecutions.find((e) => e.id === executionId);
      if (!existing) throw new Error("Execution not found");
      if (existing.status !== "waiting_approval") {
        throw new Error("Execution is not waiting for approval");
      }
      const now = new Date().toISOString();
      updated = normalizeExecution({
        ...existing,
        status: "succeeded",
        approvalStatus: "approved",
        completedAt: now,
        durationMs: existing.startedAt
          ? new Date(now).getTime() - new Date(existing.startedAt).getTime()
          : undefined,
        steps: existing.steps.map((step) =>
          step.type === "approval"
            ? { ...step, status: "succeeded", message: "Approved", completedAt: now }
            : step.status === "pending"
              ? { ...step, status: "succeeded", completedAt: now, message: "Completed after approval (mock)" }
              : step
        ),
        resultSummary: "Approved and completed (mock)",
      });

      return api.withAuditEntries(
        {
          ...s,
          automationExecutions: s.automationExecutions.map((e) =>
            e.id === executionId ? updated : e
          ),
        },
        [
          {
            action: "approved",
            entityType: "automation_execution",
            entityId: executionId,
            metadata: { mockMode: true },
          },
        ]
      );
    });
    return updated;
  }

  function rejectExecution(executionId: string, reason?: string): AutomationExecutionRecord {
    api.requireAutomationApprove();
    let updated!: AutomationExecutionRecord;
    api.setState((s) => {
      const existing = s.automationExecutions.find((e) => e.id === executionId);
      if (!existing) throw new Error("Execution not found");
      if (existing.status !== "waiting_approval") {
        throw new Error("Execution is not waiting for approval");
      }
      const now = new Date().toISOString();
      updated = normalizeExecution({
        ...existing,
        status: "cancelled",
        approvalStatus: "rejected",
        completedAt: now,
        errorMessage: reason ?? "Rejected by approver",
        steps: existing.steps.map((step) =>
          step.type === "approval"
            ? { ...step, status: "failed", message: reason ?? "Rejected", completedAt: now }
            : step.status === "pending"
              ? { ...step, status: "skipped", message: "Skipped after rejection" }
              : step
        ),
        resultSummary: "Rejected by approver (mock)",
      });

      return api.withAuditEntries(
        {
          ...s,
          automationExecutions: s.automationExecutions.map((e) =>
            e.id === executionId ? updated : e
          ),
        },
        [
          {
            action: "rejected",
            entityType: "automation_execution",
            entityId: executionId,
            metadata: { mockMode: true, reason },
          },
        ]
      );
    });
    return updated;
  }

  /** @deprecated Use archiveWorkflow — preserves execution history */
  function deleteWorkflow(id: string) {
    archiveWorkflow(id);
  }

  /** @deprecated Use activateWorkflow / pauseWorkflow */
  function toggleWorkflow(id: string) {
    const workflow = getWorkflow(id);
    if (workflow.status === "active") pauseWorkflow(id);
    else activateWorkflow(id);
  }

  /** @deprecated Use executeWorkflow */
  function runWorkflow(id: string): string[] {
    const execution = executeWorkflow(id);
    return execution.steps.map((step) =>
      step.status === "succeeded" ? `✓ ${step.name}` : `• ${step.name}: ${step.message ?? step.status}`
    );
  }

  return {
    getWorkflows,
    getWorkflow,
    createWorkflow,
    updateWorkflow,
    activateWorkflow,
    pauseWorkflow,
    archiveWorkflow,
    duplicateWorkflow,
    getExecutions,
    getExecution,
    executeWorkflow,
    retryExecution,
    approveExecution,
    rejectExecution,
    validateWorkflow,
    deleteWorkflow,
    toggleWorkflow,
    runWorkflow,
  };
}
