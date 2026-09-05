import type { CreateAuditLogInput } from "./auditLogs";
import type { AuditValue, CRMState, SalesTargetRecord, TargetHistoryRecord } from "./types";
import {
  findTargetConflict,
  getAchievedForUser,
  getDefaultTargetPeriod,
  getSalespersonTargetRows,
  getTargetSummary,
  getTeamTargetRows,
  normalizeSalesTarget,
  sortTargetHistory,
  type CreateTargetInput,
  type UpdateTargetInput,
} from "./targets";
import { generateId } from "./storage";
import { getUserById } from "./helpers";

export type TargetStoreApi = {
  getState: () => CRMState;
  setState: (updater: (prev: CRMState) => CRMState) => void;
  withAuditEntries: (s: CRMState, entries: CreateAuditLogInput[]) => CRMState;
  requireTargetManage: () => void;
  userHasPermission: (permission: string) => boolean;
};

export function createTargetStore(api: TargetStoreApi) {
  function getTargetSummaryView() {
    return getTargetSummary(api.getState());
  }

  function getSalespersonTargets() {
    return getSalespersonTargetRows(api.getState());
  }

  function getTeamTargets() {
    return getTeamTargetRows(api.getState());
  }

  function getTargetHistory(targetId?: string) {
    const history = api.getState().targetHistory;
    const filtered = targetId ? history.filter((item) => item.targetId === targetId) : history;
    return sortTargetHistory(filtered);
  }

  function createSalesTarget(input: CreateTargetInput) {
    api.requireTargetManage();
    const state = api.getState();
    const user = getUserById(state, input.userId);
    if (!user) throw new Error("Select a valid user");
    if (user.status === "inactive" && input.targetType === "salesperson") {
      throw new Error("Cannot create targets for inactive users");
    }
    if (input.targetType === "team" && user.role !== "sales_manager") {
      throw new Error("Team targets must be assigned to a manager");
    }
    if (input.targetAmount < 0) throw new Error("Target amount must be zero or greater");
    const conflict = findTargetConflict(
      state.salesTargets,
      input.userId,
      input.period,
      input.targetType
    );
    if (conflict) throw new Error("An active target already exists for this user and period");

    const now = new Date().toISOString();
    const target = normalizeSalesTarget({
      id: generateId("st"),
      userId: input.userId,
      period: input.period,
      periodType: input.periodType,
      targetType: input.targetType,
      targetAmount: input.targetAmount,
      achievedAmount:
        input.targetType === "salesperson" ? getAchievedForUser(state, input.userId) : 0,
      status: "active",
      team: input.team ?? user.team,
      createdAt: now,
      updatedAt: now,
    });

    api.setState((s) =>
      api.withAuditEntries(
        {
          ...s,
          salesTargets: [...s.salesTargets, target],
        },
        [
          {
            action: "created",
            entityType: "sales_target",
            entityId: target.id,
            newValue: target as unknown as AuditValue,
            metadata: { reason: input.reason },
          },
        ]
      )
    );
    return target;
  }

  function updateSalesTarget(id: string, input: UpdateTargetInput) {
    api.requireTargetManage();
    const state = api.getState();
    const existing = state.salesTargets.find((item) => item.id === id);
    if (!existing) throw new Error("Target not found");
    if (input.targetAmount != null && input.targetAmount < 0) {
      throw new Error("Target amount must be zero or greater");
    }
    const nextPeriod = input.period ?? existing.period;
    const nextType = existing.targetType;
    const conflict = findTargetConflict(
      state.salesTargets,
      existing.userId,
      nextPeriod,
      nextType,
      id
    );
    if (conflict && (input.status ?? existing.status) === "active") {
      throw new Error("An active target already exists for this user and period");
    }

    const nextAmount = input.targetAmount ?? existing.targetAmount;
    const historyEntry: TargetHistoryRecord | undefined =
      input.targetAmount != null && input.targetAmount !== existing.targetAmount
        ? {
            id: generateId("th"),
            targetId: id,
            previousAmount: existing.targetAmount,
            newAmount: nextAmount,
            changedBy: state.currentUserId,
            changedAt: new Date().toISOString(),
            reason: input.reason,
          }
        : undefined;

    const updated: SalesTargetRecord = {
      ...existing,
      period: nextPeriod,
      periodType: input.periodType ?? existing.periodType,
      targetAmount: nextAmount,
      status: input.status ?? existing.status,
      updatedAt: new Date().toISOString(),
    };

    api.setState((s) =>
      api.withAuditEntries(
        {
          ...s,
          salesTargets: s.salesTargets.map((item) => (item.id === id ? updated : item)),
          targetHistory: historyEntry ? [historyEntry, ...s.targetHistory] : s.targetHistory,
        },
        [
          {
            action: "updated",
            entityType: "sales_target",
            entityId: id,
            previousValue: existing as unknown as AuditValue,
            newValue: updated as unknown as AuditValue,
            metadata: { reason: input.reason },
          },
        ]
      )
    );
    return updated;
  }

  function archiveSalesTarget(id: string, reason?: string) {
    return updateSalesTarget(id, { status: "archived", reason });
  }

  function getActiveSalesTargets() {
    return api.getState().salesTargets.filter((item) => item.status === "active");
  }

  function getDefaultPeriod() {
    return getDefaultTargetPeriod(api.getState());
  }

  return {
    getTargetSummaryView,
    getSalespersonTargets,
    getTeamTargets,
    getTargetHistory,
    createSalesTarget,
    updateSalesTarget,
    archiveSalesTarget,
    getActiveSalesTargets,
    getDefaultPeriod,
  };
}
