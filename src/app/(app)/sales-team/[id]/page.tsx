"use client";

import { Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { SalespersonMonitor } from "@/components/sales-team/salesperson-monitor";

function SalespersonDetailContent() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const fromManager = searchParams.get("fromManager");
  const backHref = fromManager ? `/sales-team/manager/${fromManager}` : "/sales-team";
  const backLabel = fromManager ? "Back to Manager 360" : "Back to Sales Team";

  return (
    <SalespersonMonitor
      userId={params.id}
      backHref={backHref}
      backLabel={backLabel}
      crumb={fromManager ? "Manager 360" : "Sales Team"}
      allowTeamChange
      allowReassign
    />
  );
}

export default function SalespersonDetailPage() {
  return (
    <Suspense fallback={null}>
      <SalespersonDetailContent />
    </Suspense>
  );
}
