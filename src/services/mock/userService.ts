import { delay } from "@/store/storage";
import * as store from "@/store/crmStore";

export async function getUsers() {
  await delay();
  return store.getUsers();
}

export async function createUser(data: Parameters<typeof store.createUser>[0]) {
  await delay();
  return store.createUser(data);
}

export async function updateUser(id: string, data: Parameters<typeof store.updateUser>[1]) {
  await delay();
  return store.updateUser(id, data);
}

export async function deactivateUser(id: string) {
  await delay();
  store.deactivateUser(id);
}

export async function setCurrentUser(userId: string) {
  await delay();
  store.setCurrentUser(userId);
}

export async function getCurrentUser() {
  await delay();
  return store.getCurrentUser();
}
