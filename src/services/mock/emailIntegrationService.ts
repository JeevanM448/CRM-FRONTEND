import { delay } from "@/store/storage";
import * as store from "@/store/crmStore";
import type {
  ConnectEmailProviderInput,
  UpdateEmailIntegrationInput,
} from "../interfaces";

export async function getIntegrations() {
  await delay();
  return store.getEmailIntegrations();
}

export async function getIntegration(id: string) {
  await delay();
  return store.getEmailIntegration(id);
}

export async function connectProvider(input: ConnectEmailProviderInput) {
  await delay(300);
  return store.connectEmailProvider(input);
}

export async function disconnectIntegration(id: string) {
  await delay(200);
  return store.disconnectEmailIntegration(id);
}

export async function reconnectIntegration(id: string) {
  await delay(300);
  return store.reconnectEmailIntegration(id);
}

export async function updateIntegration(id: string, data: UpdateEmailIntegrationInput) {
  await delay(150);
  return store.updateEmailIntegration(id, data);
}

export async function syncIntegration(id: string) {
  await delay(500);
  return store.syncEmailIntegration(id);
}

export async function getSyncRuns(integrationId: string) {
  await delay();
  return store.getEmailSyncRuns(integrationId);
}

export async function getSyncStatus(integrationId: string) {
  await delay();
  return store.getEmailSyncStatus(integrationId);
}
