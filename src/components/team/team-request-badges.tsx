import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import type { TeamRequestStatus, TeamRequestType } from "@/store/types";
import { requestTypeLabel } from "@/store/teamRequests";

export function RequestStatusBadge({ status }: { status: TeamRequestStatus }) {
  if (status === "pending") return <StatusBadge status="pending" />;
  if (status === "rejected") return <Badge variant="danger">Rejected</Badge>;
  return <Badge variant="success">Approved</Badge>;
}

export function RequestTypeBadge({ type }: { type: TeamRequestType }) {
  return (
    <Badge variant={type === "remove" ? "warning" : "secondary"} className="uppercase">
      {requestTypeLabel(type)}
    </Badge>
  );
}
