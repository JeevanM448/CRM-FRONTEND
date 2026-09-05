import type { FollowUp, User } from "@/types";
import type { CRMState } from "./types";
import { canSeeOwner, getDataScope } from "./scope";
import { getUserById } from "./helpers";
import { getTeamCustomerOwners, type TeamCustomerOwnerOption } from "./teamCustomers";

export type FollowUpAccessStatus = "allowed" | "denied" | "not_found";

export interface TeamFollowUpsSummary {
  totalFollowUps: number;
  overdueCount: number;
  todayCount: number;
  upcomingCount: number;
  completedCount: number;
}

export function getFollowUpsForUser(state: CRMState, userId: string): FollowUp[] {
  const scope = getDataScope(state, userId);
  if (scope.unrestricted) return state.followUps;
  const ownerIds = new Set(scope.ownerIds);
  return state.followUps.filter((item) => ownerIds.has(item.ownerId));
}

export function getTeamFollowUps(state: CRMState, manager: User): FollowUp[] {
  if (manager.role !== "sales_manager") return [];
  return getFollowUpsForUser(state, manager.id);
}

export function getTeamFollowUpOwners(state: CRMState, manager: User): TeamCustomerOwnerOption[] {
  return getTeamCustomerOwners(state, manager);
}

export function getTeamFollowUpsSummary(state: CRMState, manager: User): TeamFollowUpsSummary {
  const followUps = getTeamFollowUps(state, manager);
  const countStatus = (status: FollowUp["status"]) =>
    followUps.filter((item) => item.status === status).length;
  return {
    totalFollowUps: followUps.length,
    overdueCount: countStatus("overdue"),
    todayCount: countStatus("today"),
    upcomingCount: countStatus("upcoming"),
    completedCount: countStatus("completed"),
  };
}

export function canViewFollowUp(
  viewer: User | undefined,
  followUpId: string,
  state: CRMState
): boolean {
  if (!viewer) return false;
  const followUp = state.followUps.find((item) => item.id === followUpId);
  if (!followUp) return false;
  return canSeeOwner(getDataScope(state, viewer.id), followUp.ownerId);
}

export function getFollowUpAccessStatus(
  state: CRMState,
  viewerId: string,
  followUpId: string
): FollowUpAccessStatus {
  const viewer = getUserById(state, viewerId);
  if (!viewer) return "not_found";
  const followUp = state.followUps.find((item) => item.id === followUpId);
  if (!followUp) return "not_found";
  return canViewFollowUp(viewer, followUpId, state) ? "allowed" : "denied";
}
