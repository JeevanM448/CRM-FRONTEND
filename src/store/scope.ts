import type { CRMState } from "./types";
import type { User } from "@/types";

export type ScopeType = "organization" | "team" | "self";

export interface DataScope {
  type: ScopeType;
  unrestricted: boolean;
  ownerIds: string[];
}

export function getManagedSalespeople(state: CRMState, manager: User): User[] {
  return state.users.filter(
    (user) => user.role === "salesperson" && user.managerId === manager.id
  );
}

export function getDataScope(state: CRMState, userId: string): DataScope {
  const user = state.users.find((item) => item.id === userId);
  if (!userId || !user) {
    return { type: "self", unrestricted: false, ownerIds: [] };
  }
  if (user.role === "admin") {
    return { type: "organization", unrestricted: true, ownerIds: [] };
  }
  if (user.role === "sales_manager") {
    const members = getManagedSalespeople(state, user);
    return {
      type: "team",
      unrestricted: false,
      ownerIds: [user.id, ...members.map((member) => member.id)],
    };
  }
  return { type: "self", unrestricted: false, ownerIds: [user.id] };
}

export function canSeeOwner(scope: DataScope, ownerId?: string) {
  if (scope.unrestricted) return true;
  if (!ownerId) return false;
  return scope.ownerIds.includes(ownerId);
}

export function canViewManagedMember(
  viewer: User | undefined,
  memberId: string,
  state: CRMState
) {
  if (!viewer) return false;
  if (viewer.role === "admin") return true;
  if (viewer.role !== "sales_manager") return false;
  return getManagedSalespeople(state, viewer).some((member) => member.id === memberId);
}

export function filterByScope<T extends { ownerId?: string }>(
  items: T[],
  state: CRMState,
  userId: string
): T[] {
  const scope = getDataScope(state, userId);
  if (scope.unrestricted) return items;
  const ids = new Set(scope.ownerIds);
  return items.filter((item) => item.ownerId != null && ids.has(item.ownerId));
}

/** Returns a CRM slice limited to the current user's mock data scope. */
export function applyScope(state: CRMState, scope: DataScope): CRMState {
  if (scope.unrestricted) return state;
  const ids = new Set(scope.ownerIds);
  const customers = state.customers.filter((item) => ids.has(item.ownerId));
  const customerIds = new Set(customers.map((item) => item.id));
  const deals = state.deals.filter((item) => ids.has(item.ownerId));
  const dealIds = new Set(deals.map((item) => item.id));
  const contacts = state.contacts.filter(
    (item) => ids.has(item.ownerId) || customerIds.has(item.companyId)
  );
  const emails = state.emails.filter(
    (item) =>
      (item.customerId != null && customerIds.has(item.customerId)) ||
      (item.dealId != null && dealIds.has(item.dealId))
  );
  const purchaseOrders = state.purchaseOrders.filter((item) => ids.has(item.ownerId));
  const followUps = state.followUps.filter((item) => ids.has(item.ownerId));
  const activities = state.activities.filter(
    (item) =>
      (item.actorId != null && ids.has(item.actorId)) ||
      (item.dealId != null && dealIds.has(item.dealId)) ||
      (item.customerId != null && customerIds.has(item.customerId))
  );
  const users = state.users.filter((item) => ids.has(item.id));
  const salesTargets = state.salesTargets.filter((item) => ids.has(item.userId));
  const notifications = state.notifications.filter((item) => item.userId === state.currentUserId);
  const documents = (state.documents ?? []).filter((doc) => {
    if (ids.has(doc.uploadedBy)) return true;
    if (doc.entityType === "customer" && doc.entityId && customerIds.has(doc.entityId)) return true;
    if (doc.entityType === "deal" && doc.entityId && dealIds.has(doc.entityId)) return true;
    if (doc.entityType === "purchase_order" && doc.entityId) {
      return purchaseOrders.some((po) => po.id === doc.entityId);
    }
    return false;
  });
  const teamRequests =
    scope.type === "team"
      ? state.teamRequests.filter((item) => item.managerId === state.currentUserId)
      : [];
  const auditLogs = scope.unrestricted ? state.auditLogs : [];

  return {
    ...state,
    customers,
    contacts,
    deals,
    emails,
    purchaseOrders,
    followUps,
    activities,
    users,
    salesTargets,
    notifications,
    documents,
    teamRequests,
    auditLogs,
  };
}
