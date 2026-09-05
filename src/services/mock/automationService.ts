import { delay } from "@/store/storage";
import * as store from "@/store/crmStore";
import type { AutomationWorkflow } from "@/types";
import type { CreateWorkflowInput } from "@/store/helpers";
import type { WorkflowValidationResult } from "@/store/automation";

export async function getWorkflows() {
  await delay();
  return store.getWorkflows();
}

export async function getWorkflow(id: string) {
  await delay();
  return store.getWorkflow(id);
}

export async function createWorkflow(data: CreateWorkflowInput) {
  await delay();
  return store.createWorkflow(data);
}

export async function updateWorkflow(
  id: string,
  data: Partial<CreateWorkflowInput & { status?: AutomationWorkflow["status"] }>
) {
  await delay();
  return store.updateWorkflow(id, data);
}

export async function activateWorkflow(id: string) {
  await delay();
  return store.activateWorkflow(id);
}

export async function pauseWorkflow(id: string) {
  await delay();
  return store.pauseWorkflow(id);
}

export async function archiveWorkflow(id: string) {
  await delay();
  return store.archiveWorkflow(id);
}

export async function duplicateWorkflow(id: string) {
  await delay();
  return store.duplicateWorkflow(id);
}

export async function getExecutions(workflowId?: string) {
  await delay();
  return store.getExecutions(workflowId);
}

export async function getExecution(id: string) {
  await delay();
  return store.getExecution(id);
}

export async function executeWorkflow(id: string, context?: Record<string, unknown>) {
  await delay(400);
  return store.executeWorkflow(id, context);
}

export async function retryExecution(executionId: string) {
  await delay(400);
  return store.retryExecution(executionId);
}

export async function approveExecution(executionId: string) {
  await delay();
  return store.approveExecution(executionId);
}

export async function rejectExecution(executionId: string, reason?: string) {
  await delay();
  return store.rejectExecution(executionId, reason);
}

export async function validateWorkflow(
  data: Partial<AutomationWorkflow>
): Promise<WorkflowValidationResult> {
  await delay();
  return store.validateWorkflow(data);
}

/** @deprecated Use archiveWorkflow */
export async function deleteWorkflow(id: string) {
  await delay();
  store.deleteWorkflow(id);
}

/** @deprecated Use activateWorkflow / pauseWorkflow */
export async function toggleWorkflow(id: string) {
  await delay();
  store.toggleWorkflow(id);
}

/** @deprecated Use executeWorkflow */
export async function runWorkflow(id: string) {
  await delay(400);
  return store.runWorkflow(id);
}
