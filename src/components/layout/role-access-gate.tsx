"use client";

import { usePathname } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { canAccessPath } from "@/lib/auth/access";
import { canViewManagedMember } from "@/store/scope";
import { useCRMStore, useCurrentUser, usePermissions } from "@/store/CRMStoreProvider";

export function RoleAccessGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const user = useCurrentUser();
  const { can } = usePermissions();
  const { getSnapshot, getCustomerAccessStatus, getDealAccessStatus, getPurchaseOrderAccessStatus } = useCRMStore();
  const role = user?.role ?? "viewer";

  if (!canAccessPath(role, pathname, can)) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="Access restricted"
        description="This area is not available in the current portal. This is a frontend navigation check only, not production authorization."
      />
    );
  }

  const memberMatch = pathname.match(/^\/my-team\/([^/]+)/);
  if (memberMatch && !canViewManagedMember(user, memberMatch[1], getSnapshot())) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="Access restricted"
        description="This salesperson is not on your team. This is a frontend navigation check only, not production authorization."
      />
    );
  }

  const customerMatch = pathname.match(/^\/customers\/([^/]+)/);
  if (customerMatch && getCustomerAccessStatus(customerMatch[1]) === "denied") {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="Access restricted"
        description="This customer is outside your team scope. This is a frontend navigation check only, not production authorization."
      />
    );
  }

  const dealMatch = pathname.match(/^\/deals\/([^/]+)/);
  if (dealMatch && getDealAccessStatus(dealMatch[1]) === "denied") {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="Access restricted"
        description="This deal is outside your team scope. This is a frontend navigation check only, not production authorization."
      />
    );
  }

  const poMatch = pathname.match(/^\/purchase-orders\/([^/]+)/);
  if (poMatch && getPurchaseOrderAccessStatus(poMatch[1]) === "denied") {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="Access restricted"
        description="This purchase order is outside your team scope. This is a frontend navigation check only, not production authorization."
      />
    );
  }

  return <>{children}</>;
}
