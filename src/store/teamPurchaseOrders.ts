import type { PurchaseOrder, User } from "@/types";
import type { CRMState } from "./types";
import { canSeeOwner, getDataScope } from "./scope";
import { getUserById } from "./helpers";
import { getTeamCustomerOwners, type TeamCustomerOwnerOption } from "./teamCustomers";

export type PurchaseOrderAccessStatus = "allowed" | "denied" | "not_found";

export interface TeamPurchaseOrdersSummary {
  totalPOs: number;
  totalValue: number;
  pendingCount: number;
  approvedCount: number;
  cancelledCount: number;
  completedCount: number;
  processingCount: number;
}

export function getPurchaseOrdersForUser(state: CRMState, userId: string): PurchaseOrder[] {
  const scope = getDataScope(state, userId);
  if (scope.unrestricted) return state.purchaseOrders;
  const ownerIds = new Set(scope.ownerIds);
  return state.purchaseOrders.filter((po) => ownerIds.has(po.ownerId));
}

export function getTeamPurchaseOrders(state: CRMState, manager: User): PurchaseOrder[] {
  if (manager.role !== "sales_manager") return [];
  return getPurchaseOrdersForUser(state, manager.id);
}

export function getTeamPOOwners(state: CRMState, manager: User): TeamCustomerOwnerOption[] {
  return getTeamCustomerOwners(state, manager);
}

export function getTeamPurchaseOrdersSummary(
  state: CRMState,
  manager: User
): TeamPurchaseOrdersSummary {
  const pos = getTeamPurchaseOrders(state, manager);
  const countStatus = (status: PurchaseOrder["status"]) =>
    pos.filter((po) => po.status === status).length;
  return {
    totalPOs: pos.length,
    totalValue: pos.reduce((sum, po) => sum + po.amount, 0),
    pendingCount: countStatus("pending") + countStatus("received"),
    approvedCount: countStatus("approved"),
    cancelledCount: countStatus("cancelled"),
    completedCount: countStatus("completed"),
    processingCount: countStatus("processing"),
  };
}

export function canViewPurchaseOrder(
  viewer: User | undefined,
  poId: string,
  state: CRMState
): boolean {
  if (!viewer) return false;
  const po = state.purchaseOrders.find((item) => item.id === poId);
  if (!po) return false;
  return canSeeOwner(getDataScope(state, viewer.id), po.ownerId);
}

export function getPurchaseOrderAccessStatus(
  state: CRMState,
  viewerId: string,
  poId: string
): PurchaseOrderAccessStatus {
  const viewer = getUserById(state, viewerId);
  if (!viewer) return "not_found";
  const po = state.purchaseOrders.find((item) => item.id === poId);
  if (!po) return "not_found";
  return canViewPurchaseOrder(viewer, poId, state) ? "allowed" : "denied";
}
