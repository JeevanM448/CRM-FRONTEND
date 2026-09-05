import { delay } from "@/store/storage";
import * as store from "@/store/crmStore";
import type { AppSettings } from "@/store/types";

export async function getSettings() {
  await delay();
  return store.getSettings();
}

export async function updateSettings(data: Partial<AppSettings>) {
  await delay();
  store.updateSettings(data);
}

export async function resetDemoData() {
  await delay(300);
  store.resetStore();
}

export async function exportDemoData() {
  await delay();
  return store.exportStoreData();
}

export async function search(query: string) {
  await delay();
  return store.search(query);
}
