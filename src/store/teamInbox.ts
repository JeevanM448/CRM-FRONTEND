import type { EmailThread, User } from "@/types";
import type { CRMState } from "./types";
import { applyScope, getDataScope } from "./scope";
import { getUserById } from "./helpers";

export type EmailAccessStatus = "allowed" | "denied" | "not_found";

export interface TeamInboxSummary {
  totalEmails: number;
  unreadCount: number;
  importantCount: number;
  linkedDeals: number;
  linkedCustomers: number;
}

export function getEmailsForUser(state: CRMState, userId: string): EmailThread[] {
  const scoped = applyScope(state, getDataScope(state, userId));
  return scoped.emails.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getTeamInboxEmails(state: CRMState, manager: User): EmailThread[] {
  if (manager.role !== "sales_manager") return [];
  return getEmailsForUser(state, manager.id);
}

export function getTeamInboxSummary(state: CRMState, manager: User): TeamInboxSummary {
  const emails = getTeamInboxEmails(state, manager);
  const customerIds = new Set(emails.filter((email) => email.customerId).map((email) => email.customerId!));
  const dealIds = new Set(emails.filter((email) => email.dealId).map((email) => email.dealId!));
  return {
    totalEmails: emails.length,
    unreadCount: emails.filter((email) => !email.read).length,
    importantCount: emails.filter((email) => email.important).length,
    linkedDeals: dealIds.size,
    linkedCustomers: customerIds.size,
  };
}

export function canViewEmail(viewer: User | undefined, emailId: string, state: CRMState): boolean {
  if (!viewer) return false;
  const email = state.emails.find((item) => item.id === emailId);
  if (!email) return false;
  const scoped = applyScope(state, getDataScope(state, viewer.id));
  return scoped.emails.some((item) => item.id === emailId);
}

export function getEmailAccessStatus(
  state: CRMState,
  viewerId: string,
  emailId: string
): EmailAccessStatus {
  const viewer = getUserById(state, viewerId);
  if (!viewer) return "not_found";
  const email = state.emails.find((item) => item.id === emailId);
  if (!email) return "not_found";
  return canViewEmail(viewer, emailId, state) ? "allowed" : "denied";
}
