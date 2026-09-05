import type { User } from "@/types";
import type { CRMState } from "./types";
import { getManagedSalespeople } from "./scope";
import { getUserById } from "./helpers";
import {
  calculateAchievement,
  calculateRemaining,
  getAchievedForUser,
  type SalespersonTargetRow,
  type TargetSummary,
} from "./targets";

export interface ManagerTeamTargetSummary extends TargetSummary {
  teamMemberCount: number;
}

export function getManagerTeamTargetRows(state: CRMState, manager: User): SalespersonTargetRow[] {
  if (manager.role !== "sales_manager") return [];
  const memberIds = new Set(getManagedSalespeople(state, manager).map((member) => member.id));
  return state.salesTargets
    .filter((item) => item.targetType === "salesperson" && memberIds.has(item.userId))
    .map((target) => {
      const user = getUserById(state, target.userId);
      if (!user) return null;
      const achieved = target.achievedAmount || getAchievedForUser(state, target.userId);
      return {
        target,
        user,
        managerName: manager.name,
        achieved,
        remaining: calculateRemaining(target.targetAmount, achieved),
        achievementPercent: calculateAchievement(achieved, target.targetAmount),
      };
    })
    .filter((row): row is SalespersonTargetRow => row !== null)
    .sort((a, b) => a.user.name.localeCompare(b.user.name));
}

export function getManagerTeamTargetSummary(
  state: CRMState,
  manager: User
): ManagerTeamTargetSummary {
  const rows = getManagerTeamTargetRows(state, manager);
  const teamTarget = state.salesTargets.find(
    (item) =>
      item.targetType === "team" && item.userId === manager.id && item.status === "active"
  );
  const teamTargetAmount =
    teamTarget?.targetAmount ?? rows.reduce((sum, row) => sum + row.target.targetAmount, 0);
  const achievedSales = rows.reduce((sum, row) => sum + row.achieved, 0);
  const remaining = calculateRemaining(teamTargetAmount, achievedSales);
  return {
    organizationTarget: teamTargetAmount,
    achievedSales,
    remaining,
    achievementPercent: calculateAchievement(achievedSales, teamTargetAmount),
    activeTargets: rows.filter((row) => row.target.status === "active").length,
    teamMemberCount: getManagedSalespeople(state, manager).length,
  };
}
