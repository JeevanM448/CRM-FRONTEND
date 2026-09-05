import { Badge } from "@/components/ui/badge";
import type { DealStage, EntityStatus, POStatus, Priority } from "@/types";

const stageLabels: Record<DealStage, string> = {
  new: "New Lead",
  qualified: "Qualified",
  quotation: "Quotation",
  negotiation: "Negotiation",
  won: "Won",
  lost: "Lost",
};

const stageVariants: Record<DealStage, "default" | "secondary" | "success" | "warning" | "ai" | "outline" | "danger"> = {
  new: "outline",
  qualified: "secondary",
  quotation: "ai",
  negotiation: "warning",
  won: "success",
  lost: "danger",
};

const statusVariants: Record<EntityStatus, "success" | "warning" | "secondary" | "danger"> = {
  active: "success",
  inactive: "secondary",
  pending: "warning",
  completed: "success",
  cancelled: "danger",
};

const poVariants: Record<POStatus, "warning" | "secondary" | "success" | "ai" | "outline" | "danger"> = {
  pending: "warning",
  received: "secondary",
  approved: "ai",
  processing: "outline",
  completed: "success",
  cancelled: "danger",
};

const priorityVariants: Record<Priority, "danger" | "warning" | "secondary"> = {
  high: "danger",
  medium: "warning",
  low: "secondary",
};

interface StatusBadgeProps {
  status: DealStage | EntityStatus | POStatus | Priority | string;
  type?: "stage" | "status" | "po" | "priority";
}

export function StatusBadge({ status, type = "status" }: StatusBadgeProps) {
  if (type === "stage") {
    const stage = status as DealStage;
    return (
      <Badge variant={stageVariants[stage] ?? "outline"}>
        {stageLabels[stage] ?? status}
      </Badge>
    );
  }

  if (type === "po") {
    const poStatus = status as POStatus;
    return (
      <Badge variant={poVariants[poStatus] ?? "outline"} className="capitalize">
        {poStatus}
      </Badge>
    );
  }

  if (type === "priority") {
    const priority = status as Priority;
    return (
      <Badge variant={priorityVariants[priority] ?? "secondary"} className="uppercase">
        {priority}
      </Badge>
    );
  }

  const entityStatus = status as EntityStatus;
  return (
    <Badge variant={statusVariants[entityStatus] ?? "secondary"} className="capitalize">
      {status}
    </Badge>
  );
}

export { stageLabels };
