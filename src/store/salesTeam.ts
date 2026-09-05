import type { Activity, Customer, Deal, FollowUp, PurchaseOrder, User } from "@/types";
import type { CRMState } from "./types";
import { getPipelineData, getUserById } from "./helpers";
import { getManagedSalespeople } from "./scope";

export type PerformanceStatus = "on_track" | "watch" | "behind";

export interface SalespersonMetrics {
  sales: number;
  target: number;
  achievement: number;
  pipeline: number;
  wonCount: number;
  lostCount: number;
  activeCount: number;
  followUpCount: number;
  overdueCount: number;
  pendingFollowUps: number;
  completedFollowUps: number;
  followUpCompletion: number;
}

export interface SalespersonRow extends SalespersonMetrics {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: User["role"];
  team: string;
  managerId?: string;
  managerName: string;
  status: User["status"];
  performance: PerformanceStatus;
}

export interface SalesTeamOverview {
  totalSalespeople: number;
  totalSales: number;
  totalPipeline: number;
  targetAchievement: number;
  wonDeals: number;
  activeDeals: number;
}

export interface ManagerTeamOverview {
  totalSalespeople: number;
  totalSales: number;
  totalPipeline: number;
  targetAmount: number;
  targetAchievement: number;
  remaining: number;
  wonDeals: number;
  lostDeals: number;
  activeDeals: number;
  closedDeals: number;
  winRate: number;
  followUpCompletion: number;
}

export interface ManagerRow {
  id: string;
  name: string;
  email: string;
  phone?: string;
  team: string;
  status: User["status"];
  memberCount: number;
  totalSales: number;
  targetAmount: number;
  targetAchievement: number;
  totalPipeline: number;
  wonDeals: number;
  activeDeals: number;
}

export interface ManagerDetail {
  user: User;
  overview: ManagerTeamOverview;
  members: SalespersonRow[];
  customers: Customer[];
  deals: Deal[];
  followUps: FollowUp[];
  purchaseOrders: PurchaseOrder[];
  activities: Activity[];
  pipeline: ReturnType<typeof getPipelineData>;
}

export interface SalespersonDetail {
  user: User;
  metrics: SalespersonMetrics;
  performance: PerformanceStatus;
  customers: Customer[];
  deals: Deal[];
  followUps: FollowUp[];
  purchaseOrders: PurchaseOrder[];
  activities: Activity[];
}

export function isSalesTeamMember(user: User) {
  return user.role === "salesperson" || user.role === "sales_manager";
}

export function getPerformanceStatus(achievement: number): PerformanceStatus {
  if (achievement >= 90) return "on_track";
  if (achievement >= 70) return "watch";
  return "behind";
}

export function getSalespersonMetrics(state: CRMState, userId: string): SalespersonMetrics {
  const deals = state.deals.filter((d) => d.ownerId === userId);
  const won = deals.filter((d) => d.stage === "won");
  const lost = deals.filter((d) => d.stage === "lost");
  const active = deals.filter((d) => d.stage !== "won" && d.stage !== "lost");
  const target = state.salesTargets.find((t) => t.userId === userId)?.targetAmount ?? 0;
  const sales = won.reduce((sum, d) => sum + d.value, 0);
  const pipeline = active.reduce((sum, d) => sum + d.value, 0);
  const followUps = state.followUps.filter((f) => f.ownerId === userId);
  const completedFollowUps = followUps.filter((f) => f.status === "completed").length;
  const achievement = target > 0 ? Math.round((sales / target) * 100) : 0;
  return {
    sales,
    target,
    achievement,
    pipeline,
    wonCount: won.length,
    lostCount: lost.length,
    activeCount: active.length,
    followUpCount: followUps.length,
    overdueCount: followUps.filter((f) => f.status === "overdue").length,
    pendingFollowUps: followUps.filter((f) => f.status !== "completed").length,
    completedFollowUps,
    followUpCompletion:
      followUps.length > 0 ? Math.round((completedFollowUps / followUps.length) * 100) : 0,
  };
}

export function getSalesTeamMembers(state: CRMState): User[] {
  return state.users.filter((user) => user.role === "salesperson");
}

export function getSalespersonRow(state: CRMState, user: User): SalespersonRow {
  const metrics = getSalespersonMetrics(state, user.id);
  const manager = user.managerId ? getUserById(state, user.managerId) : undefined;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    team: user.team || "—",
    managerId: user.managerId,
    managerName: manager?.name ?? "—",
    status: user.status,
    performance: getPerformanceStatus(metrics.achievement),
    ...metrics,
  };
}

export function getSalesTeamRows(state: CRMState): SalespersonRow[] {
  return getSalesTeamMembers(state).map((user) => getSalespersonRow(state, user));
}

export function getMyTeamRows(state: CRMState, manager: User): SalespersonRow[] {
  return getManagedSalespeople(state, manager).map((user) => getSalespersonRow(state, user));
}

export function getMyTeamOverview(state: CRMState, manager: User): ManagerTeamOverview {
  const rows = getMyTeamRows(state, manager);
  const memberIds = new Set(rows.map((row) => row.id));
  const totalTarget = rows.reduce((sum, row) => sum + row.target, 0);
  const totalSales = rows.reduce((sum, row) => sum + row.sales, 0);
  const wonDeals = rows.reduce((sum, row) => sum + row.wonCount, 0);
  const lostDeals = rows.reduce((sum, row) => sum + row.lostCount, 0);
  const closedDeals = wonDeals + lostDeals;
  const followUps = state.followUps.filter((item) => memberIds.has(item.ownerId));
  const completedFollowUps = followUps.filter((item) => item.status === "completed").length;
  return {
    totalSalespeople: rows.length,
    totalSales,
    totalPipeline: rows.reduce((sum, row) => sum + row.pipeline, 0),
    targetAmount: totalTarget,
    targetAchievement: totalTarget > 0 ? Math.round((totalSales / totalTarget) * 100) : 0,
    remaining: Math.max(0, totalTarget - totalSales),
    wonDeals,
    lostDeals,
    activeDeals: rows.reduce((sum, row) => sum + row.activeCount, 0),
    closedDeals,
    winRate: closedDeals > 0 ? Math.round((wonDeals / closedDeals) * 100) : 0,
    followUpCompletion:
      followUps.length > 0 ? Math.round((completedFollowUps / followUps.length) * 100) : 0,
  };
}

export function getManagerRows(state: CRMState): ManagerRow[] {
  return state.users
    .filter((user) => user.role === "sales_manager")
    .map((user) => {
      const overview = getMyTeamOverview(state, user);
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        team: user.team ?? user.department,
        status: user.status,
        memberCount: overview.totalSalespeople,
        totalSales: overview.totalSales,
        targetAmount: overview.targetAmount,
        targetAchievement: overview.targetAchievement,
        totalPipeline: overview.totalPipeline,
        wonDeals: overview.wonDeals,
        activeDeals: overview.activeDeals,
      };
    });
}

export function getManagerDetail(state: CRMState, managerId: string): ManagerDetail | undefined {
  const user = getUserById(state, managerId);
  if (!user || user.role !== "sales_manager") return undefined;
  const members = getMyTeamRows(state, user);
  const ownerIds = new Set([user.id, ...members.map((member) => member.id)]);
  const deals = state.deals.filter((item) => ownerIds.has(item.ownerId));
  const dealIds = new Set(deals.map((item) => item.id));
  const customers = state.customers.filter((item) => ownerIds.has(item.ownerId));
  const customerIds = new Set(customers.map((item) => item.id));
  return {
    user,
    overview: getMyTeamOverview(state, user),
    members,
    customers,
    deals,
    followUps: state.followUps.filter((item) => ownerIds.has(item.ownerId)),
    purchaseOrders: state.purchaseOrders.filter((item) => ownerIds.has(item.ownerId)),
    activities: state.activities
      .filter(
        (item) =>
          (item.actorId != null && ownerIds.has(item.actorId)) ||
          (item.dealId != null && dealIds.has(item.dealId)) ||
          (item.customerId != null && customerIds.has(item.customerId))
      )
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    pipeline: getPipelineData({ ...state, deals }),
  };
}

export function getSalesTeamOverview(state: CRMState): SalesTeamOverview {
  const rows = getSalesTeamRows(state);
  const totalTarget = rows.reduce((sum, row) => sum + row.target, 0);
  const totalSales = rows.reduce((sum, row) => sum + row.sales, 0);
  return {
    totalSalespeople: rows.length,
    totalSales,
    totalPipeline: rows.reduce((sum, row) => sum + row.pipeline, 0),
    targetAchievement: totalTarget > 0 ? Math.round((totalSales / totalTarget) * 100) : 0,
    wonDeals: rows.reduce((sum, row) => sum + row.wonCount, 0),
    activeDeals: rows.reduce((sum, row) => sum + row.activeCount, 0),
  };
}

export function getSalespersonDetail(state: CRMState, userId: string): SalespersonDetail | undefined {
  const user = getUserById(state, userId);
  if (!user || !isSalesTeamMember(user)) return undefined;
  const metrics = getSalespersonMetrics(state, userId);
  const ownedDealIds = state.deals.filter((d) => d.ownerId === userId).map((d) => d.id);
  return {
    user,
    metrics,
    performance: getPerformanceStatus(metrics.achievement),
    customers: state.customers.filter((c) => c.ownerId === userId),
    deals: state.deals.filter((d) => d.ownerId === userId),
    followUps: state.followUps.filter((f) => f.ownerId === userId),
    purchaseOrders: state.purchaseOrders.filter((p) => p.ownerId === userId),
    activities: state.activities
      .filter(
        (a) =>
          a.actorId === userId ||
          (a.dealId != null && ownedDealIds.includes(a.dealId)) ||
          (a.customerId != null &&
            state.customers.some((c) => c.id === a.customerId && c.ownerId === userId))
      )
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
  };
}
