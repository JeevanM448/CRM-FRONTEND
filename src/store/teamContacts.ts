import type { Contact, User } from "@/types";
import type { CRMState } from "./types";
import { canSeeOwner, getDataScope } from "./scope";
import { getUserById } from "./helpers";
import { getTeamCustomerOwners, type TeamCustomerOwnerOption } from "./teamCustomers";

export type ContactAccessStatus = "allowed" | "denied" | "not_found";

export interface TeamContactsSummary {
  totalContacts: number;
  activeContacts: number;
  companiesRepresented: number;
  teamMemberCount: number;
}

export function getContactsForUser(state: CRMState, userId: string): Contact[] {
  const scope = getDataScope(state, userId);
  if (scope.unrestricted) return state.contacts;
  const ownerIds = new Set(scope.ownerIds);
  const customerIds = new Set(
    state.customers.filter((customer) => ownerIds.has(customer.ownerId)).map((customer) => customer.id)
  );
  return state.contacts.filter(
    (contact) => ownerIds.has(contact.ownerId) || customerIds.has(contact.companyId)
  );
}

export function getTeamContacts(state: CRMState, manager: User): Contact[] {
  if (manager.role !== "sales_manager") return [];
  return getContactsForUser(state, manager.id);
}

export function getTeamContactOwners(state: CRMState, manager: User): TeamCustomerOwnerOption[] {
  return getTeamCustomerOwners(state, manager);
}

export function getTeamContactsSummary(state: CRMState, manager: User): TeamContactsSummary {
  const contacts = getTeamContacts(state, manager);
  const companies = new Set(contacts.map((contact) => contact.companyId));
  return {
    totalContacts: contacts.length,
    activeContacts: contacts.filter((contact) => contact.status === "active").length,
    companiesRepresented: companies.size,
    teamMemberCount: getTeamContactOwners(state, manager).length,
  };
}

export function canViewContact(
  viewer: User | undefined,
  contactId: string,
  state: CRMState
): boolean {
  if (!viewer) return false;
  const contact = state.contacts.find((item) => item.id === contactId);
  if (!contact) return false;
  const scope = getDataScope(state, viewer.id);
  if (scope.unrestricted) return true;
  if (canSeeOwner(scope, contact.ownerId)) return true;
  const customer = state.customers.find((item) => item.id === contact.companyId);
  return customer ? canSeeOwner(scope, customer.ownerId) : false;
}

export function getContactAccessStatus(
  state: CRMState,
  viewerId: string,
  contactId: string
): ContactAccessStatus {
  const viewer = getUserById(state, viewerId);
  if (!viewer) return "not_found";
  const contact = state.contacts.find((item) => item.id === contactId);
  if (!contact) return "not_found";
  return canViewContact(viewer, contactId, state) ? "allowed" : "denied";
}
