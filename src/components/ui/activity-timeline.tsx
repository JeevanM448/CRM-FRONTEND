import { formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Activity } from "@/types";
import {
  Clock,
  FileText,
  Handshake,
  Mail,
  Package,
  CheckCircle2,
} from "lucide-react";

const typeIcons: Record<string, typeof Mail> = {
  email: Mail,
  deal: Handshake,
  quotation: FileText,
  po: Package,
  "follow-up": CheckCircle2,
};

interface ActivityTimelineProps {
  activities: Activity[];
  className?: string;
}

export function ActivityTimeline({ activities, className }: ActivityTimelineProps) {
  if (activities.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        No activity recorded yet.
      </div>
    );
  }

  return (
    <div className={cn("space-y-0", className)}>
      {activities.map((activity, index) => {
        const Icon = typeIcons[activity.type] ?? Clock;
        return (
          <div key={activity.id} className="relative flex gap-4 pb-6 last:pb-0">
            {index < activities.length - 1 && (
              <span className="absolute left-[17px] top-9 h-[calc(100%-12px)] w-px bg-border" />
            )}
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted">
              <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="text-sm font-medium text-foreground">{activity.title}</p>
              {activity.description && (
                <p className="mt-0.5 text-sm text-muted-foreground">{activity.description}</p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">
                {formatDateTime(activity.timestamp)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
