"use client";

import { useParams } from "next/navigation";
import { SalespersonMonitor } from "@/components/sales-team/salesperson-monitor";

export default function MyTeamMemberPage() {
  const params = useParams<{ id: string }>();
  return (
    <SalespersonMonitor
      userId={params.id}
      backHref="/my-team"
      backLabel="Back to My Team"
      crumb="My Team"
      mode="manager"
    />
  );
}
