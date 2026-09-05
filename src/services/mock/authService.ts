import { delay } from "@/store/storage";
import * as store from "@/store/crmStore";
import { verifyMockPassword } from "@/store/mockCredentials";
import type { UserRole } from "@/types";
import type { UserAccount } from "@/types/account";
import type { AuthService } from "../interfaces";
import type { AuthSession } from "../types";
import { validatePasswordStrength } from "@/lib/validation";

function toSession(): AuthSession | null {
  const user = store.getCurrentUser();
  if (!user) return null;
  const account = store.getUserAccountForProfile(user.id);
  return {
    userId: user.id,
    email: account?.email ?? user.email,
    name: user.name,
    role: account?.role ?? user.role,
    organizationId: account?.organizationId,
    managerId: user.managerId,
    team: user.team,
  };
}

export async function signIn(email: string, password: string, expectedRole?: UserRole) {
  await delay(200);
  const result = store.authenticateSignIn(email, password, expectedRole ?? null);
  if (!result.ok) {
    throw new Error(result.error);
  }
  return result.session;
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

export async function isEmailAvailable(email: string, excludeUserId?: string) {
  await delay();
  return store.checkSignInEmailAvailable(email, excludeUserId);
}

export async function getAccountForUser(userId: string): Promise<UserAccount | null> {
  await delay();
  return store.getUserAccountForProfile(userId) ?? null;
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
  confirmPassword: string
) {
  await delay();
  const viewer = store.getCurrentUser();
  if (!viewer) throw new Error("You must be signed in to change your password");

  const account = store.getUserAccountForProfile(userId);
  if (!account) throw new Error("Sign-in account not found");

  if (viewer.id !== userId && viewer.role !== "admin") {
    throw new Error("You cannot change this password");
  }

  if (!currentPassword.trim()) {
    throw new Error("Current password is required");
  }
  if (!verifyMockPassword(currentPassword, account.mockPasswordHash)) {
    throw new Error("Current password is incorrect");
  }

  const strengthError = validatePasswordStrength(newPassword);
  if (strengthError) throw new Error(strengthError);
  if (newPassword !== confirmPassword) {
    throw new Error("Passwords do not match");
  }
  if (currentPassword === newPassword) {
    throw new Error("New password must be different from your current password");
  }

  store.changeUserAccountPassword(userId, newPassword);
}

export async function requestPasswordReset(email: string) {
  await delay(300);
  store.recordPasswordResetRequested(email);
}

export async function disableUserAccount(userId: string) {
  await delay();
  store.disableUserAccountByProfileId(userId);
}

export async function enableUserAccount(userId: string) {
  await delay();
  store.enableUserAccountByProfileId(userId);
}

export async function prepareAccountInvitation(userId: string) {
  await delay();
  const account = store.getUserAccountForProfile(userId);
  if (!account) throw new Error("Sign-in account not found");
  return {
    queued: false,
    email: account.email,
    role: account.role,
    message: "Invitation email will be sent when backend integration is connected.",
  };
}

export class MockAuthService implements AuthService {
  signIn = signIn;
  signOut = signOut;
  getSession = getSession;
  getCurrentUser = getCurrentUser;
  isEmailAvailable = isEmailAvailable;
  getAccountForUser = getAccountForUser;
  changePassword = changePassword;
  requestPasswordReset = requestPasswordReset;
  disableUserAccount = disableUserAccount;
  enableUserAccount = enableUserAccount;
  prepareAccountInvitation = prepareAccountInvitation;
}
