import type { User } from "@/types";
import type { CRMState, SalesTargetRecord, TargetHistoryRecord } from "./types";
import { getUserById } from "./helpers";

export type TargetPeriodType = "monthly" | "quarterly" | "yearly";
export type TargetType = "salesperson" | "team";
export type TargetStatus = "active" | "archived";

export interface TargetSummary {
  organizationTarget: number;
  achievedSales: number;
  remaining: number;
  achievementPercent: number;
  activeTargets: number;
}

export interface SalespersonTargetRow {
  target: SalesTargetRecord;
  user: User;
  managerName: string;
  achieved: number;
  remaining: number;
  achievementPercent: number;
}

export interface TeamTargetRow {
  manager: User;
  team: string;
  memberCount: number;
  targetAmount: number;
  achieved: number;
  remaining: number;
  achievementPercent: number;
  members: string[];
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function parsePeriodType(period: string): TargetPeriodType {
  if (/^\d{4}-Q[1-4]$/.test(period)) return "quarterly";
  if (/^\d{4}-\d{2}$/.test(period)) return "monthly";
  if (/^\d{4}$/.test(period)) return "yearly";
  return "quarterly";
}

export function buildPeriodValue(
  periodType: TargetPeriodType,
  year: number,
  month?: number,
  quarter?: number
): string {
  if (periodType === "yearly") return String(year);
  if (periodType === "monthly") {
    const m = month ?? 1;
    return `${year}-${String(m).padStart(2, "0")}`;
  }
  const q = quarter ?? 1;
  return `${year}-Q${q}`;
}

export function formatPeriodLabel(period: string, periodType?: TargetPeriodType): string {
  const type = periodType ?? parsePeriodType(period);
  if (type === "yearly") return `Year ${period}`;
  if (type === "monthly") {
    const [year, month] = period.split("-");
    const monthIndex = Number(month) - 1;
    return `${MONTHS[monthIndex] ?? month} ${year}`;
  }
  const [year, quarter] = period.split("-");
  return `${quarter} ${year}`;
}

export function normalizeSalesTarget(
  target: Partial<SalesTargetRecord> & Pick<SalesTargetRecord, "id" | "userId" | "period" | "targetAmount" | "achievedAmount">
): SalesTargetRecord {
  const now = new Date().toISOString();
  return {
    id: target.id,
    userId: target.userId,
    period: target.period,
    periodType: target.periodType ?? parsePeriodType(target.period),
    targetType: target.targetType ?? "salesperson",
    targetAmount: target.targetAmount,
    achievedAmount: target.achievedAmount,
    status: target.status ?? "active",
    team: target.team,
    createdAt: target.createdAt ?? now,
    updatedAt: target.updatedAt ?? now,
  };
}

export function calculateAchievement(achieved: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(100, Math.round((achieved / target) * 100));
}

export function calculateRemaining(target: number, achieved: number): number {
  return Math.max(target - achieved, 0);
}

export function getAchievedForUser(state: CRMState, userId: string): number {
  const record = state.salesTargets.find(
    (item) => item.userId === userId && item.status === "active"
  );
  if (record) return record.achievedAmount;
  return state.deals
    .filter((deal) => deal.ownerId === userId && deal.stage === "won")
    .reduce((sum, deal) => sum + deal.value, 0);
}

export function recalculateTargetAchieved(state: CRMState): CRMState["salesTargets"] {
  return state.salesTargets.map((target) => ({
    ...target,
    achievedAmount: state.deals
      .filter((deal) => deal.ownerId === target.userId && deal.stage === "won")
      .reduce((sum, deal) => sum + deal.value, 0),
  }));
}

export function getTargetSummary(state: CRMState): TargetSummary {
  const active = state.salesTargets.filter(
    (item) => item.status === "active" && item.targetType === "salesperson"
  );
  const organizationTarget = active.reduce((sum, item) => sum + item.targetAmount, 0);
  const achievedSales = active.reduce((sum, item) => sum + item.achievedAmount, 0);
  const remaining = calculateRemaining(organizationTarget, achievedSales);
  return {
    organizationTarget,
    achievedSales,
    remaining,
    achievementPercent: calculateAchievement(achievedSales, organizationTarget),
    activeTargets: active.length,
  };
}

export function getSalespersonTargetRows(state: CRMState): SalespersonTargetRow[] {
  return state.salesTargets
    .filter((item) => item.targetType === "salesperson")
    .map((target) => {
      const user = getUserById(state, target.userId);
      if (!user) return null;
      const manager = user.managerId ? getUserById(state, user.managerId) : undefined;
      const achieved = target.achievedAmount;
      return {
        target,
        user,
        managerName: manager?.name ?? "—",
        achieved,
        remaining: calculateRemaining(target.targetAmount, achieved),
        achievementPercent: calculateAchievement(achieved, target.targetAmount),
      };
    })
    .filter((row): row is SalespersonTargetRow => row !== null)
    .sort((a, b) => a.user.name.localeCompare(b.user.name));
}

export function getTeamTargetRows(state: CRMState): TeamTargetRow[] {
  const managers = state.users.filter((user) => user.role === "sales_manager");
  return managers.map((manager) => {
    const members = state.users.filter(
      (user) => user.role === "salesperson" && user.managerId === manager.id
    );
    const explicitTeamTarget = state.salesTargets.find(
      (item) =>
        item.targetType === "team" &&
        item.userId === manager.id &&
        item.status === "active"
    );
    const memberTargets = state.salesTargets.filter(
      (item) =>
        item.targetType === "salesperson" &&
        item.status === "active" &&
        members.some((member) => member.id === item.userId)
    );
    const targetAmount =
      explicitTeamTarget?.targetAmount ??
      memberTargets.reduce((sum, item) => sum + item.targetAmount, 0);
    const achieved = members.reduce((sum, member) => sum + getAchievedForUser(state, member.id), 0);
    return {
      manager,
      team: manager.team ?? "—",
      memberCount: members.length,
      targetAmount,
      achieved,
      remaining: calculateRemaining(targetAmount, achieved),
      achievementPercent: calculateAchievement(achieved, targetAmount),
      members: members.map((member) => member.name),
    };
  });
}

export function getDefaultTargetPeriod(state: CRMState): string {
  return state.organization.businessRules.defaultTargetPeriod || "2026-Q3";
}

export type CreateTargetInput = {
  userId: string;
  period: string;
  periodType: TargetPeriodType;
  targetType: TargetType;
  targetAmount: number;
  team?: string;
  reason?: string;
};

export type UpdateTargetInput = {
  period?: string;
  periodType?: TargetPeriodType;
  targetAmount?: number;
  status?: TargetStatus;
  reason?: string;
};

export function findTargetConflict(
  targets: SalesTargetRecord[],
  userId: string,
  period: string,
  targetType: TargetType,
  excludeId?: string
) {
  return targets.find(
    (item) =>
      item.id !== excludeId &&
      item.userId === userId &&
      item.period === period &&
      item.targetType === targetType &&
      item.status === "active"
  );
}

export function sortTargetHistory(history: TargetHistoryRecord[]) {
  return [...history].sort(
    (a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime()
  );
}
