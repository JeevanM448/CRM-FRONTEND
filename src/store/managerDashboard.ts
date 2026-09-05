import type { Activity, User } from "@/types";
import type { CRMState } from "./types";
import { applyScope, getDataScope } from "./scope";
import {
  getMyTeamOverview,
  getMyTeamRows,
  type ManagerTeamOverview,
  type SalespersonRow,
} from "./salesTeam";
import { getAttentionDeals, getPipelineData, getUserById } from "./helpers";
import type { PipelineStageSummary, RevenueChartPoint } from "@/services/types";

export interface ManagerDashboardKpis {
  teamSales: number;
  pipelineValue: number;
  winRate: number;
  targetAchievement: number;
  targetAmount: number;
  wonDeals: number;
  activeDeals: number;
  closedDeals: number;
}

export type ManagerAttentionItemType =
  | "overdue_follow_up"
  | "attention_deal"
  | "pending_team_request";

export interface ManagerAttentionItem {
  id: string;
  type: ManagerAttentionItemType;
  title: string;
  description: string;
  href: string;
  priority?: "low" | "medium" | "high";
}

export interface ManagerDashboardData {
  manager: User;
  team: SalespersonRow[];
  overview: ManagerTeamOverview;
  kpis: ManagerDashboardKpis;
  pipelineByStage: PipelineStageSummary[];
  salesTrend: RevenueChartPoint[];
  recentActivity: Activity[];
  attentionItems: ManagerAttentionItem[];
  pendingTeamRequests: number;
}

function buildAttentionItems(
  state: CRMState,
  scoped: CRMState,
  manager: User
): ManagerAttentionItem[] {
  const items: ManagerAttentionItem[] = [];

  scoped.followUps
    .filter((item) => item.status === "overdue")
    .slice(0, 4)
    .forEach((followUp) => {
      items.push({
        id: `follow-up-${followUp.id}`,
        type: "overdue_follow_up",
        title: followUp.title,
        description: `${followUp.customerName} · overdue`,
        href: "/follow-ups",
        priority: followUp.priority ?? "high",
      });
    });

  getAttentionDeals(scoped).forEach((deal) => {
    items.push({
      id: `deal-${deal.id}`,
      type: "attention_deal",
      title: deal.customerName ?? deal.title,
      description: deal.attentionReason ?? "Requires attention",
      href: `/deals/${deal.id}`,
      priority: deal.priority,
    });
  });

  const pendingRequests = state.teamRequests.filter(
    (request) => request.managerId === manager.id && request.status === "pending"
  );
  pendingRequests.slice(0, 2).forEach((request) => {
    const salesperson = getUserById(state, request.salespersonId);
    items.push({
      id: `request-${request.id}`,
      type: "pending_team_request",
      title: `${request.type === "add" ? "Add" : "Remove"} request: ${salesperson?.name ?? "Salesperson"}`,
      description: "Pending admin approval",
      href: "/my-team",
      priority: "medium",
    });
  });

  return items.slice(0, 8);
}

function buildSalesTrend(overview: ManagerTeamOverview): RevenueChartPoint[] {
  const months = ["Apr", "May", "Jun", "Jul", "Aug", "Sep"];
  if (overview.totalSales === 0 && overview.targetAmount === 0) {
    return months.map((month) => ({ month, revenue: 0, target: 0 }));
  }
  return months.map((month, index) => ({
    month,
    revenue: Math.round(overview.totalSales * (0.5 + index * 0.1)),
    target: overview.targetAmount > 0 ? Math.round(overview.targetAmount / 6) : 0,
  }));
}

/** Centralized manager dashboard payload — team scope only. */
export function getManagerDashboardData(
  state: CRMState,
  manager: User
): ManagerDashboardData | null {
  if (manager.role !== "sales_manager") return null;

  const scope = getDataScope(state, manager.id);
  const scoped = applyScope(state, scope);
  const team = getMyTeamRows(state, manager);
  const overview = getMyTeamOverview(state, manager);

  const kpis: ManagerDashboardKpis = {
    teamSales: overview.totalSales,
    pipelineValue: overview.totalPipeline,
    winRate: overview.winRate,
    targetAchievement: overview.targetAchievement,
    targetAmount: overview.targetAmount,
    wonDeals: overview.wonDeals,
    activeDeals: overview.activeDeals,
    closedDeals: overview.closedDeals,
  };

  const recentActivity = [...scoped.activities]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 8);

  const pendingTeamRequests = state.teamRequests.filter(
    (request) => request.managerId === manager.id && request.status === "pending"
  ).length;

  return {
    manager,
    team,
    overview,
    kpis,
    pipelineByStage: getPipelineData(scoped),
  salesTrend: buildSalesTrend(overview),
  recentActivity,
    attentionItems: buildAttentionItems(state, scoped, manager),
    pendingTeamRequests,
  };
}
