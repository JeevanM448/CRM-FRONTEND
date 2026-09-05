import { delay } from "@/store/storage";
import * as store from "@/store/crmStore";
import type { UserRole } from "@/types";
import type { AuthService } from "../interfaces";
import type { AuthSession } from "../types";

function toSession(): AuthSession | null {
  const user = store.getCurrentUser();
  if (!user) return null;
  return {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}

export async function signIn(email: string, password: string, expectedRole?: UserRole) {
  await delay(200);
  if (!password.trim()) {
    throw new Error("Password is required");
  }
  const normalized = email.trim().toLowerCase();
  const user = store.getUsers().find((u) => u.email.toLowerCase() === normalized);
  if (!user || user.status === "inactive") {
    throw new Error("Invalid email or password");
  }
  // Mock portal check only. Real authorization is not implemented.
  if (expectedRole && user.role !== expectedRole) {
    throw new Error("This account cannot sign in to the selected portal");
  }
  store.setCurrentUser(user.id);
  store.recordLoginAudit();
  const session = toSession();
  if (!session) throw new Error("Unable to start session");
  return session;
}

export async function signOut() {
  await delay();
  const userId = store.getCurrentUser()?.id;
  if (userId) store.recordLogoutAudit(userId);
  store.clearCurrentUser();
}

export async function getSession() {
  await delay();
  return toSession();
}

export async function getCurrentUser() {
  await delay();
  return store.getCurrentUser() ?? null;
}

export class MockAuthService implements AuthService {
  signIn = signIn;
  signOut = signOut;
  getSession = getSession;
  getCurrentUser = getCurrentUser;
}
