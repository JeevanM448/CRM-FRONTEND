import { Badge } from "@/components/ui/badge";
import type { PerformanceStatus } from "@/store/salesTeam";

const labels: Record<PerformanceStatus, string> = {
  on_track: "On track",
  watch: "Watch",
  behind: "Behind",
};

const variants: Record<PerformanceStatus, "success" | "warning" | "danger"> = {
  on_track: "success",
  watch: "warning",
  behind: "danger",
};

export function PerformanceBadge({ status }: { status: PerformanceStatus }) {
  return <Badge variant={variants[status]}>{labels[status]}</Badge>;
}
