import { delay } from "@/store/storage";
import * as store from "@/store/crmStore";
import type { DealStage } from "@/types";

export async function getDeals() {
  await delay();
  return store.getDeals();
}

export async function getDeal(id: string) {
  await delay();
  const deal = store.getDeal(id);
  if (!deal) throw new Error("Deal not found");
  return deal;
}

export async function getDealsByCustomer(customerId: string) {
  await delay();
  return store.getDealsByCustomer(customerId);
}

export async function getTeamDeals() {
  await delay();
  return store.getTeamDeals();
}

export async function getTeamDealsSummary() {
  await delay();
  return store.getTeamDealsSummary();
}

export async function getTeamDealOwners() {
  await delay();
  return store.getTeamDealOwners();
}

export async function getDealAccessStatus(id: string) {
  await delay();
  return store.getDealAccessStatus(id);
}

export async function getTeamPipelineSummary() {
  await delay();
  return store.getTeamPipelineSummary();
}

export async function createDeal(data: Parameters<typeof store.createDeal>[0]) {
  await delay();
  return store.createDeal(data);
}

export async function updateDeal(id: string, data: Parameters<typeof store.updateDeal>[1]) {
  await delay();
  return store.updateDeal(id, data);
}

export async function updateDealStage(id: string, stage: DealStage) {
  await delay();
  return store.updateDealStage(id, stage);
}

export async function deleteDeal(id: string) {
  await delay();
  store.deleteDeal(id);
}
