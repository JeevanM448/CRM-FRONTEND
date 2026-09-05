import type { User } from "@/types";
import type { AutomationExecutionRecord, CRMState } from "./types";
import { canSeeOwner, getDataScope } from "./scope";
import { getUserById } from "./helpers";

export type AutomationExecutionAccessStatus = "allowed" | "denied" | "not_found";

export interface TeamAutomationSummary {
  pendingApprovals: number;
  totalExecutions: number;
  succeededCount: number;
  failedCount: number;
}

function resolveExecutionOwnerId(
  execution: AutomationExecutionRecord,
  state: CRMState
): string | undefined {
  const metadata = execution.metadata ?? {};
  if (typeof metadata.ownerId === "string") return metadata.ownerId;
  if (typeof metadata.dealId === "string") {
    return state.deals.find((deal) => deal.id === metadata.dealId)?.ownerId;
  }
  if (typeof metadata.customerId === "string") {
    return state.customers.find((customer) => customer.id === metadata.customerId)?.ownerId;
  }
  if (typeof metadata.poId === "string") {
    return state.purchaseOrders.find((po) => po.id === metadata.poId)?.ownerId;
  }
  if (typeof metadata.followUpId === "string") {
    return state.followUps.find((item) => item.id === metadata.followUpId)?.ownerId;
  }
  return undefined;
}

export function getAutomationExecutionsForUser(
  state: CRMState,
  userId: string
): AutomationExecutionRecord[] {
  const viewer = getUserById(state, userId);
  if (!viewer) return [];
  const scope = getDataScope(state, userId);
  if (scope.unrestricted) return state.automationExecutions;
  return state.automationExecutions.filter((execution) =>
    canViewAutomationExecution(viewer, execution.id, state)
  );
}

export function canViewAutomationExecution(
  viewer: User | undefined,
  executionId: string,
  state: CRMState
): boolean {
  if (!viewer) return false;
  const execution = state.automationExecutions.find((item) => item.id === executionId);
  if (!execution) return false;
  const scope = getDataScope(state, viewer.id);
  if (scope.unrestricted) return true;
  const ownerId = resolveExecutionOwnerId(execution, state);
  if (!ownerId) return false;
  return canSeeOwner(scope, ownerId);
}

export function getAutomationExecutionAccessStatus(
  state: CRMState,
  viewerId: string,
  executionId: string
): AutomationExecutionAccessStatus {
  const viewer = getUserById(state, viewerId);
  if (!viewer) return "not_found";
  const execution = state.automationExecutions.find((item) => item.id === executionId);
  if (!execution) return "not_found";
  return canViewAutomationExecution(viewer, executionId, state) ? "allowed" : "denied";
}

export function getTeamAutomationSummary(state: CRMState, manager: User): TeamAutomationSummary {
  const executions = getAutomationExecutionsForUser(state, manager.id);
  return {
    pendingApprovals: executions.filter((item) => item.status === "waiting_approval").length,
    totalExecutions: executions.length,
    succeededCount: executions.filter((item) => item.status === "succeeded").length,
    failedCount: executions.filter((item) => item.status === "failed").length,
  };
}

export function getPendingApprovalsForManager(
  state: CRMState,
  manager: User
): AutomationExecutionRecord[] {
  return getAutomationExecutionsForUser(state, manager.id).filter(
    (item) => item.status === "waiting_approval"
  );
}
