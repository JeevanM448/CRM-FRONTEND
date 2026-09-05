import { delay } from "@/store/storage";
import * as store from "@/store/crmStore";
import type { TeamRequestService } from "../interfaces";
import type { TeamRequestType } from "@/store/types";

export async function searchSalespeople(query: string) {
  await delay();
  return store.searchSalespeopleForTeamRequest(query);
}

export async function getTeamRequestsForManager() {
  await delay();
  return store.getTeamRequestsForManager();
}

export async function getPendingTeamRequest(salespersonId: string, type?: TeamRequestType) {
  await delay();
  return store.getPendingTeamRequest(salespersonId, type);
}

export async function createTeamRequest(salespersonId: string, type?: TeamRequestType) {
  await delay();
  return store.createTeamRequest(salespersonId, type);
}

export async function cancelTeamRequest(id: string) {
  await delay();
  store.cancelTeamRequest(id);
}

export async function approveTeamRequest(id: string) {
  await delay();
  return store.approveTeamRequest(id);
}

export async function rejectTeamRequest(id: string, rejectionReason?: string) {
  await delay();
  return store.rejectTeamRequest(id, rejectionReason);
}

export class MockTeamRequestService implements TeamRequestService {
  searchSalespeople = searchSalespeople;
  getTeamRequestsForManager = getTeamRequestsForManager;
  getPendingTeamRequest = getPendingTeamRequest;
  createTeamRequest = createTeamRequest;
  cancelTeamRequest = cancelTeamRequest;
  approveTeamRequest = approveTeamRequest;
  rejectTeamRequest = rejectTeamRequest;
}
