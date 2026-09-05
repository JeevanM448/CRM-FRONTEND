import type { User } from "@/types";
import type { CRMState } from "./types";
import { getUserById } from "./helpers";
import {
  calculateAchievement,
  calculateRemaining,
  getAchievedForUser,
  type SalespersonTargetRow,
  type TargetSummary,
} from "./targets";

export function getSalespersonOwnTargetRows(state: CRMState, user: User): SalespersonTargetRow[] {
  if (user.role !== "salesperson") return [];
  const manager = user.managerId ? getUserById(state, user.managerId) : undefined;
  return state.salesTargets
    .filter((item) => item.targetType === "salesperson" && item.userId === user.id)
    .map((target) => {
      const achieved = target.achievedAmount || getAchievedForUser(state, user.id);
      return {
        target,
        user,
        managerName: manager?.name ?? "—",
        achieved,
        remaining: calculateRemaining(target.targetAmount, achieved),
        achievementPercent: calculateAchievement(achieved, target.targetAmount),
      };
    })
    .sort((a, b) => b.target.period.localeCompare(a.target.period));
}

export function getSalespersonOwnTargetSummary(state: CRMState, user: User): TargetSummary {
  const rows = getSalespersonOwnTargetRows(state, user);
  const active = rows.find((row) => row.target.status === "active") ?? rows[0];
  const targetAmount = active?.target.targetAmount ?? 0;
  const achievedSales = active?.achieved ?? 0;
  const remaining = calculateRemaining(targetAmount, achievedSales);
  return {
    organizationTarget: targetAmount,
    achievedSales,
    remaining,
    achievementPercent: calculateAchievement(achievedSales, targetAmount),
    activeTargets: rows.filter((row) => row.target.status === "active").length,
  };
}
