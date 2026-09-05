import { delay } from "@/store/storage";
import * as store from "@/store/crmStore";

export async function getPurchaseOrders() {
  await delay();
  return store.getPurchaseOrders();
}

export async function getPurchaseOrder(id: string) {
  await delay();
  const po = store.getPurchaseOrder(id);
  if (!po) throw new Error("Purchase order not found");
  return po;
}

export async function getTeamPurchaseOrders() {
  await delay();
  return store.getTeamPurchaseOrders();
}

export async function getTeamPurchaseOrdersSummary() {
  await delay();
  return store.getTeamPurchaseOrdersSummary();
}

export async function getTeamPOOwners() {
  await delay();
  return store.getTeamPOOwners();
}

export async function getPurchaseOrderAccessStatus(id: string) {
  await delay();
  return store.getPurchaseOrderAccessStatus(id);
}

export async function createPurchaseOrder(data: Parameters<typeof store.createPurchaseOrder>[0]) {
  await delay(300);
  return store.createPurchaseOrder(data);
}

export async function updatePurchaseOrder(
  id: string,
  data: Parameters<typeof store.updatePurchaseOrder>[1]
) {
  await delay();
  return store.updatePurchaseOrder(id, data);
}

export async function deletePurchaseOrder(id: string) {
  await delay();
  store.deletePurchaseOrder(id);
}
