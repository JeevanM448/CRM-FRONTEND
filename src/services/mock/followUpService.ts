import { delay } from "@/store/storage";
import * as store from "@/store/crmStore";

export async function getFollowUps() {
  await delay();
  return store.getFollowUps();
}

export async function getFollowUpsByDeal(dealId: string) {
  await delay();
  return store.getFollowUpsByDeal(dealId);
}

export async function getTeamFollowUps() {
  await delay();
  return store.getTeamFollowUps();
}

export async function getTeamFollowUpsSummary() {
  await delay();
  return store.getTeamFollowUpsSummary();
}

export async function getTeamFollowUpOwners() {
  await delay();
  return store.getTeamFollowUpOwners();
}

export async function getFollowUpAccessStatus(id: string) {
  await delay();
  return store.getFollowUpAccessStatus(id);
}

export async function createFollowUp(data: Parameters<typeof store.createFollowUp>[0]) {
  await delay();
  return store.createFollowUp(data);
}

export async function updateFollowUp(id: string, data: Parameters<typeof store.updateFollowUp>[1]) {
  await delay();
  return store.updateFollowUp(id, data);
}

export async function completeFollowUp(id: string) {
  await delay();
  store.completeFollowUp(id);
}

export async function rescheduleFollowUp(id: string, dueDate: string) {
  await delay();
  store.rescheduleFollowUp(id, dueDate);
}

export async function deleteFollowUp(id: string) {
  await delay();
  store.deleteFollowUp(id);
}
