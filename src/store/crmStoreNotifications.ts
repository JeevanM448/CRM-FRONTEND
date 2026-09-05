import type { CRMState } from "./types";
import {
  buildAdminSystemNotifications,
  createNotification,
  filterNotifications,
  mergeAdminNotifications,
} from "./notifications";
import type { AppNotification } from "./types";

export type NotificationStoreApi = {
  getState: () => CRMState;
  setState: (updater: (prev: CRMState) => CRMState) => void;
  requireNotificationView: () => void;
};

export function createNotificationStore(api: NotificationStoreApi) {
  function getScopedNotifications() {
    const userId = api.getState().currentUserId;
    return api
      .getState()
      .notifications.filter((item) => item.userId === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  function getAdminNotifications(filter: "all" | "unread" | "critical" | "warnings" = "all") {
    api.requireNotificationView();
    return filterNotifications(getScopedNotifications(), filter);
  }

  function syncAdminSystemNotifications() {
    const state = api.getState();
    const viewer = state.users.find((user) => user.id === state.currentUserId);
    if (!viewer || viewer.role !== "admin") return;

    const currentAdmin = state.notifications.filter((item) => item.userId === viewer.id);
    const generated = buildAdminSystemNotifications(state).map((item) => {
      const existing = currentAdmin.find((entry) => entry.id === item.id);
      if (!existing) return item;
      const sameContent =
        existing.title === item.title &&
        existing.message === item.message &&
        existing.severity === item.severity &&
        existing.type === item.type;
      if (sameContent) {
        return { ...item, read: existing.read, timestamp: existing.timestamp };
      }
      return { ...item, read: existing.read };
    });

    const merged = mergeAdminNotifications(currentAdmin, generated);
    const otherUsers = state.notifications.filter((item) => item.userId !== viewer.id);
    const nextNotifications = [...merged, ...otherUsers];

    const unchanged =
      nextNotifications.length === state.notifications.length &&
      nextNotifications.every((item) => {
        const previous = state.notifications.find((entry) => entry.id === item.id);
        return (
          previous &&
          previous.read === item.read &&
          previous.title === item.title &&
          previous.message === item.message &&
          previous.severity === item.severity &&
          previous.timestamp === item.timestamp
        );
      });

    if (unchanged) return;

    api.setState((s) => ({ ...s, notifications: nextNotifications }));
  }

  function pushNotification(
    notification: Omit<AppNotification, "id" | "timestamp" | "read"> & { read?: boolean }
  ) {
    api.setState((s) => ({
      ...s,
      notifications: createNotification(s.notifications, notification),
    }));
  }

  function markNotificationRead(id: string) {
    api.setState((s) => ({
      ...s,
      notifications: s.notifications.map((item) =>
        item.userId === s.currentUserId && item.id === id ? { ...item, read: true } : item
      ),
    }));
  }

  function markAllNotificationsRead() {
    api.setState((s) => ({
      ...s,
      notifications: s.notifications.map((item) =>
        item.userId === s.currentUserId ? { ...item, read: true } : item
      ),
    }));
  }

  function getUnreadNotificationCount() {
    return getScopedNotifications().filter((item) => !item.read).length;
  }

  return {
    getScopedNotifications,
    getAdminNotifications,
    syncAdminSystemNotifications,
    pushNotification,
    markNotificationRead,
    markAllNotificationsRead,
    getUnreadNotificationCount,
  };
}

export type { NotificationSeverity, NotificationType } from "./types";
