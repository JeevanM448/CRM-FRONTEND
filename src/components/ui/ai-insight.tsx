"use client";

import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AIInsightProps {
  title?: string;
  probability?: number;
  risk?: string;
  recommendedAction?: string;
  insight?: string;
  onGenerate?: () => void;
  generateLabel?: string;
  className?: string;
}

export function AIInsight({
  title = "AI Deal Insight",
  probability,
  risk,
  recommendedAction,
  insight,
  onGenerate,
  generateLabel = "Generate Follow-up",
  className,
}: AIInsightProps) {
  return (
    <Card className={cn("border-purple-100 bg-gradient-to-br from-purple-50/80 to-white", className)}>
      <CardContent className="p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-ai">
          <Sparkles className="h-4 w-4" />
          <span>✦ {title}</span>
        </div>
        <div className="mt-4 space-y-3 text-sm">
          {insight && <p className="text-foreground">{insight}</p>}
          {probability !== undefined && (
            <div>
              <span className="text-muted-foreground">Probability: </span>
              <span className="font-semibold text-foreground">{probability}%</span>
            </div>
          )}
          {risk && (
            <div>
              <span className="text-muted-foreground">Risk: </span>
              <span className="text-foreground">{risk}</span>
            </div>
          )}
          {recommendedAction && (
            <div>
              <span className="text-muted-foreground">Recommended action: </span>
              <span className="font-medium text-foreground">{recommendedAction}</span>
            </div>
          )}
        </div>
        {onGenerate && (
          <Button variant="ai" size="sm" className="mt-4" onClick={onGenerate}>
            <Sparkles className="h-3.5 w-3.5" />
            {generateLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
