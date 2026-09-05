import type { User } from "@/types";
import type { AccountRole, AccountStatus, UserAccount } from "@/types/account";
import { DEFAULT_ORGANIZATION_ID } from "@/types/account";
import type { CRMState } from "./types";
import { generateId } from "./storage";
import { mockHashPassword } from "./mockCredentials";
import { getUserById } from "./helpers";

export function normalizeSignInEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isAccountRole(role: User["role"]): role is AccountRole {
  return role === "admin" || role === "sales_manager" || role === "salesperson";
}

export function mapUserStatusToAccountStatus(userStatus: User["status"]): AccountStatus {
  return userStatus === "active" ? "active" : "disabled";
}

export function getAccountByEmail(state: CRMState, email: string): UserAccount | undefined {
  const normalized = normalizeSignInEmail(email);
  return state.userAccounts.find((account) => normalizeSignInEmail(account.email) === normalized);
}

export function getAccountByUserId(state: CRMState, userId: string): UserAccount | undefined {
  return state.userAccounts.find((account) => account.userId === userId);
}

export function isSignInEmailAvailable(
  state: CRMState,
  email: string,
  excludeUserId?: string
): boolean {
  const normalized = normalizeSignInEmail(email);
  if (!normalized) return false;
  const conflict = state.userAccounts.some(
    (account) =>
      normalizeSignInEmail(account.email) === normalized &&
      account.userId !== excludeUserId
  );
  return !conflict;
}

export interface CreateAccountInput {
  userId: string;
  email: string;
  password: string;
  role: AccountRole;
  status?: AccountStatus;
  organizationId?: string;
}

export function createUserAccountRecord(
  state: CRMState,
  input: CreateAccountInput
): UserAccount {
  const email = normalizeSignInEmail(input.email);
  if (!email) throw new Error("Sign-in email is required");
  if (!input.password.trim()) throw new Error("Password is required");
  if (!isSignInEmailAvailable(state, email)) {
    throw new Error("A sign-in account with this email already exists");
  }
  const user = getUserById(state, input.userId);
  if (!user) throw new Error("User profile not found");
  if (!isAccountRole(user.role)) {
    throw new Error("This user role cannot have a sign-in account");
  }
  const now = new Date().toISOString();
  return {
    id: generateId("acct"),
    organizationId: input.organizationId ?? DEFAULT_ORGANIZATION_ID,
    userId: input.userId,
    email,
    role: input.role,
    status: input.status ?? "active",
    mockPasswordHash: mockHashPassword(input.password),
    createdAt: now,
    updatedAt: now,
  };
}

export function updateUserAccountRecord(
  account: UserAccount,
  data: Partial<Pick<UserAccount, "email" | "status">>
): UserAccount {
  const now = new Date().toISOString();
  return {
    ...account,
    email: data.email ? normalizeSignInEmail(data.email) : account.email,
    status: data.status ?? account.status,
    updatedAt: now,
  };
}

export function accountCanSignIn(account: UserAccount): boolean {
  return account.status === "active";
}

export function getAccountRoleLabel(role: AccountRole): string {
  if (role === "admin") return "Admin";
  if (role === "sales_manager") return "Manager";
  return "Salesperson";
}
