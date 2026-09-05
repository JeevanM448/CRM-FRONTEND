"use client";

import { cn } from "@/lib/utils";
import { TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface KpiCardProps {
  label: string;
  value: string;
  subValue?: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  progress?: number;
  featured?: boolean;
  className?: string;
}

export function KpiCard({
  label,
  value,
  subValue,
  change,
  changeType = "neutral",
  progress,
  featured,
  className,
}: KpiCardProps) {
  return (
    <Card
      className={cn(
        featured && "border-primary/20 bg-primary text-primary-foreground",
        className
      )}
    >
      <CardContent className="p-5">
        <p
          className={cn(
            "text-sm font-medium",
            featured ? "text-white/70" : "text-muted-foreground"
          )}
        >
          {label}
        </p>
        <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
        {subValue && (
          <p
            className={cn(
              "mt-1 text-sm",
              featured ? "text-white/70" : "text-muted-foreground"
            )}
          >
            {subValue}
          </p>
        )}
        {change && (
          <div
            className={cn(
              "mt-3 flex items-center gap-1 text-xs font-medium",
              changeType === "positive" && !featured && "text-success",
              changeType === "negative" && !featured && "text-danger",
              featured && "text-brand-lime"
            )}
          >
            {changeType === "positive" && <TrendingUp className="h-3.5 w-3.5" />}
            {changeType === "negative" && <TrendingDown className="h-3.5 w-3.5" />}
            {change}
          </div>
        )}
        {progress !== undefined && (
          <div className="mt-4 space-y-2">
            <Progress
              value={progress}
              className="h-2"
              indicatorClassName={featured ? "bg-brand-lime" : "bg-primary"}
            />
            <p
              className={cn(
                "text-xs",
                featured ? "text-white/70" : "text-muted-foreground"
              )}
            >
              {progress}% achieved
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
