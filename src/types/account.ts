import type { UserRole } from "@/types";

/** Sign-in account status — separate from CRM entity status on User profile. */
export type AccountStatus = "active" | "invited" | "disabled";

export type AccountRole = Extract<UserRole, "admin" | "sales_manager" | "salesperson">;

/**
 * Backend-ready sign-in account record.
 * MOCK ONLY: `mockPasswordHash` is used only by MockAuthService and must never
 * be replicated in production. Supabase Auth will own credentials later.
 */
export interface UserAccount {
  id: string;
  organizationId: string;
  userId: string;
  email: string;
  role: AccountRole;
  status: AccountStatus;
  /** MOCK ONLY — not for production databases. */
  mockPasswordHash?: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export const DEFAULT_ORGANIZATION_ID = "org-1";

/** Development/demo password for seeded accounts. Not a production credential. */
export const DEMO_ACCOUNT_PASSWORD = "demo";
