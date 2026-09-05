"use client";

import { useParams } from "next/navigation";
import { ManagerMonitor } from "@/components/sales-team/manager-monitor";

export default function ManagerDetailPage() {
  const params = useParams<{ id: string }>();
  return <ManagerMonitor managerId={params.id} />;
}
