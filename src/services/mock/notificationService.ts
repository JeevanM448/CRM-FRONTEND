import { delay } from "@/store/storage";
import * as store from "@/store/crmStore";

export async function getNotifications() {
  await delay();
  return store.getNotifications();
}

export async function getUnreadCount() {
  await delay();
  return store.getUnreadNotificationCount();
}

export async function markRead(id: string) {
  await delay();
  store.markNotificationRead(id);
}

export async function markAllRead() {
  await delay();
  store.markAllNotificationsRead();
}
