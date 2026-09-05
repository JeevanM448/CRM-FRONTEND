import type { Customer, User } from "@/types";
import type { CRMState } from "./types";
import { canSeeOwner, getDataScope, getManagedSalespeople } from "./scope";
import { enrichCustomer, getUserById } from "./helpers";

export type CustomerAccessStatus = "allowed" | "denied" | "not_found";

export interface TeamCustomersSummary {
  totalCustomers: number;
  activeCustomers: number;
  totalRevenue: number;
  totalActiveDeals: number;
  teamMemberCount: number;
}

export interface TeamCustomerOwnerOption {
  id: string;
  name: string;
}

/** Returns customers visible to the current user's data scope. */
export function getCustomersForUser(state: CRMState, userId: string): Customer[] {
  const scope = getDataScope(state, userId);
  if (scope.unrestricted) {
    return state.customers.map((customer) => enrichCustomer(customer, state));
  }
  const ownerIds = new Set(scope.ownerIds);
  return state.customers
    .filter((customer) => ownerIds.has(customer.ownerId))
    .map((customer) => enrichCustomer(customer, state));
}

/** Team customers for a manager — only their managed salespeople (+ manager-owned records). */
export function getTeamCustomers(state: CRMState, manager: User): Customer[] {
  if (manager.role !== "sales_manager") return [];
  return getCustomersForUser(state, manager.id);
}

export function getTeamCustomerOwners(state: CRMState, manager: User): TeamCustomerOwnerOption[] {
  if (manager.role !== "sales_manager") return [];
  const members = getManagedSalespeople(state, manager);
  const options: TeamCustomerOwnerOption[] = members.map((member) => ({
    id: member.id,
    name: member.name,
  }));
  const managerOwned = state.customers.some((customer) => customer.ownerId === manager.id);
  if (managerOwned) {
    options.unshift({ id: manager.id, name: `${manager.name} (Manager)` });
  }
  return options;
}

export function getTeamCustomersSummary(state: CRMState, manager: User): TeamCustomersSummary {
  const customers = getTeamCustomers(state, manager);
  return {
    totalCustomers: customers.length,
    activeCustomers: customers.filter((customer) => customer.status === "active").length,
    totalRevenue: customers.reduce((sum, customer) => sum + customer.revenue, 0),
    totalActiveDeals: customers.reduce((sum, customer) => sum + customer.activeDeals, 0),
    teamMemberCount: getManagedSalespeople(state, manager).length,
  };
}

export function canViewCustomer(
  viewer: User | undefined,
  customerId: string,
  state: CRMState
): boolean {
  if (!viewer) return false;
  const customer = state.customers.find((item) => item.id === customerId);
  if (!customer) return false;
  return canSeeOwner(getDataScope(state, viewer.id), customer.ownerId);
}

export function getCustomerAccessStatus(
  state: CRMState,
  viewerId: string,
  customerId: string
): CustomerAccessStatus {
  const viewer = getUserById(state, viewerId);
  if (!viewer) return "not_found";
  const customer = state.customers.find((item) => item.id === customerId);
  if (!customer) return "not_found";
  return canViewCustomer(viewer, customerId, state) ? "allowed" : "denied";
}
