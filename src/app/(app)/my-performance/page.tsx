"use client";

import { SalespersonMonitor } from "@/components/sales-team/salesperson-monitor";
import { useCurrentUser } from "@/store/CRMStoreProvider";

export default function MyPerformancePage() {
  const user = useCurrentUser();

  if (!user || user.role !== "salesperson") {
    return null;
  }

  return (
    <SalespersonMonitor
      userId={user.id}
      backHref="/dashboard"
      backLabel="Back to dashboard"
      crumb="My Performance"
      allowTeamChange={false}
      allowReassign={false}
      mode="admin"
    />
  );
}
