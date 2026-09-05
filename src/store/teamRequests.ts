import type { User } from "@/types";
import type { CRMState, TeamRequest, TeamRequestStatus, TeamRequestType } from "./types";
import { getUserById } from "./helpers";

export type TeamRequestEligibility =
  | "eligible"
  | "self"
  | "not_salesperson"
  | "already_on_team"
  | "assigned_elsewhere"
  | "pending_request"
  | "not_on_team";

export interface TeamRequestCandidate {
  id: string;
  name: string;
  email: string;
  role: User["role"];
  team?: string;
  managerId?: string;
  managerName?: string;
  status: User["status"];
  eligibility: TeamRequestEligibility;
  eligibilityMessage?: string;
}

export interface TeamRequestView extends TeamRequest {
  salespersonName: string;
  salespersonEmail: string;
  managerName: string;
  managerTeam?: string;
}

export const TEAM_REQUEST_MESSAGES = {
  self: "You cannot request yourself.",
  not_salesperson: "Only salespeople can be requested.",
  already_on_team: "This salesperson is already on your team.",
  assigned_elsewhere: "This salesperson is already assigned to another manager.",
  pending_add: "A pending request already exists for this salesperson.",
  pending_remove: "A pending removal request already exists.",
  not_on_team: "You can only request removal for a salesperson on your team.",
  stale:
    "Request is no longer valid because the salesperson's team assignment has changed.",
} as const;

export function hasPendingTeamRequest(
  state: CRMState,
  salespersonId: string,
  managerId: string,
  type: TeamRequestType
) {
  return state.teamRequests.some(
    (item) =>
      item.salespersonId === salespersonId &&
      item.managerId === managerId &&
      item.type === type &&
      item.status === "pending"
  );
}

export function isAssignedToManager(salesperson: User, manager: User) {
  return salesperson.managerId === manager.id;
}

export function getAddRequestEligibility(
  state: CRMState,
  manager: User,
  candidate: User
): { eligibility: TeamRequestEligibility; message?: string } {
  if (candidate.id === manager.id) {
    return { eligibility: "self", message: TEAM_REQUEST_MESSAGES.self };
  }
  if (candidate.role !== "salesperson") {
    return { eligibility: "not_salesperson", message: TEAM_REQUEST_MESSAGES.not_salesperson };
  }
  if (candidate.managerId === manager.id) {
    return { eligibility: "already_on_team", message: TEAM_REQUEST_MESSAGES.already_on_team };
  }
  if (candidate.managerId) {
    return {
      eligibility: "assigned_elsewhere",
      message: TEAM_REQUEST_MESSAGES.assigned_elsewhere,
    };
  }
  if (hasPendingTeamRequest(state, candidate.id, manager.id, "add")) {
    return { eligibility: "pending_request", message: TEAM_REQUEST_MESSAGES.pending_add };
  }
  return { eligibility: "eligible" };
}

export function getRemoveRequestEligibility(
  state: CRMState,
  manager: User,
  candidate: User
): { eligibility: TeamRequestEligibility; message?: string } {
  if (candidate.id === manager.id) {
    return { eligibility: "self", message: TEAM_REQUEST_MESSAGES.self };
  }
  if (candidate.role !== "salesperson") {
    return { eligibility: "not_salesperson", message: TEAM_REQUEST_MESSAGES.not_salesperson };
  }
  if (!isAssignedToManager(candidate, manager)) {
    return { eligibility: "not_on_team", message: TEAM_REQUEST_MESSAGES.not_on_team };
  }
  if (hasPendingTeamRequest(state, candidate.id, manager.id, "remove")) {
    return { eligibility: "pending_request", message: TEAM_REQUEST_MESSAGES.pending_remove };
  }
  return { eligibility: "eligible" };
}

export function getTeamRequestEligibility(
  state: CRMState,
  manager: User,
  candidate: User,
  type: TeamRequestType = "add"
) {
  return type === "remove"
    ? getRemoveRequestEligibility(state, manager, candidate)
    : getAddRequestEligibility(state, manager, candidate);
}

export function toTeamRequestCandidate(
  state: CRMState,
  manager: User,
  user: User
): TeamRequestCandidate {
  const managerUser = user.managerId ? getUserById(state, user.managerId) : undefined;
  const result = getAddRequestEligibility(state, manager, user);
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    team: user.team,
    managerId: user.managerId,
    managerName: managerUser?.name,
    status: user.status,
    eligibility: result.eligibility,
    eligibilityMessage: result.message,
  };
}

export function searchSalespeopleForTeamRequest(
  state: CRMState,
  manager: User,
  query: string
): TeamRequestCandidate[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return state.users
    .filter(
      (user) =>
        user.name.toLowerCase().includes(q) || user.email.toLowerCase().includes(q)
    )
    .map((user) => toTeamRequestCandidate(state, manager, user))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function toTeamRequestView(state: CRMState, request: TeamRequest): TeamRequestView {
  const salesperson = getUserById(state, request.salespersonId);
  const manager = getUserById(state, request.managerId);
  return {
    ...request,
    type: request.type ?? "add",
    salespersonName: salesperson?.name ?? "Unknown salesperson",
    salespersonEmail: salesperson?.email ?? "",
    managerName: manager?.name ?? "Unknown manager",
    managerTeam: manager?.team,
  };
}

export function filterRequestsForManager(requests: TeamRequest[], managerId: string) {
  return requests.filter((item) => item.managerId === managerId);
}

export function requestStatusLabel(status: TeamRequestStatus) {
  if (status === "pending") return "Pending";
  if (status === "rejected") return "Rejected";
  return "Approved";
}

export function requestTypeLabel(type: TeamRequestType) {
  return type === "remove" ? "Remove" : "Add";
}
