import type { Deal, User } from "@/types";
import type { CRMState } from "./types";
import { canSeeOwner, getDataScope } from "./scope";
import { enrichDeal, getUserById } from "./helpers";
import { getTeamCustomerOwners, type TeamCustomerOwnerOption } from "./teamCustomers";

export type DealAccessStatus = "allowed" | "denied" | "not_found";

export interface TeamDealsSummary {
  totalDeals: number;
  pipelineValue: number;
  wonValue: number;
  wonCount: number;
  lostCount: number;
  activeCount: number;
  winRate: number;
  averageDealValue: number;
}

export function getDealsForUser(state: CRMState, userId: string): Deal[] {
  const scope = getDataScope(state, userId);
  if (scope.unrestricted) {
    return state.deals.map((deal) => enrichDeal(deal, state));
  }
  const ownerIds = new Set(scope.ownerIds);
  return state.deals
    .filter((deal) => ownerIds.has(deal.ownerId))
    .map((deal) => enrichDeal(deal, state));
}

export function getTeamDeals(state: CRMState, manager: User): Deal[] {
  if (manager.role !== "sales_manager") return [];
  return getDealsForUser(state, manager.id);
}

export function getTeamDealOwners(state: CRMState, manager: User): TeamCustomerOwnerOption[] {
  return getTeamCustomerOwners(state, manager);
}

export function getTeamDealsSummary(state: CRMState, manager: User): TeamDealsSummary {
  const deals = getTeamDeals(state, manager);
  const won = deals.filter((deal) => deal.stage === "won");
  const lost = deals.filter((deal) => deal.stage === "lost");
  const active = deals.filter((deal) => deal.stage !== "won" && deal.stage !== "lost");
  const closed = won.length + lost.length;
  const wonValue = won.reduce((sum, deal) => sum + deal.value, 0);
  const pipelineValue = active.reduce((sum, deal) => sum + deal.value, 0);
  const totalValue = deals.reduce((sum, deal) => sum + deal.value, 0);
  return {
    totalDeals: deals.length,
    pipelineValue,
    wonValue,
    wonCount: won.length,
    lostCount: lost.length,
    activeCount: active.length,
    winRate: closed > 0 ? Math.round((won.length / closed) * 100) : 0,
    averageDealValue: deals.length > 0 ? Math.round(totalValue / deals.length) : 0,
  };
}

export function canViewDeal(viewer: User | undefined, dealId: string, state: CRMState): boolean {
  if (!viewer) return false;
  const deal = state.deals.find((item) => item.id === dealId);
  if (!deal) return false;
  return canSeeOwner(getDataScope(state, viewer.id), deal.ownerId);
}

export function getDealAccessStatus(
  state: CRMState,
  viewerId: string,
  dealId: string
): DealAccessStatus {
  const viewer = getUserById(state, viewerId);
  if (!viewer) return "not_found";
  const deal = state.deals.find((item) => item.id === dealId);
  if (!deal) return "not_found";
  return canViewDeal(viewer, dealId, state) ? "allowed" : "denied";
}
