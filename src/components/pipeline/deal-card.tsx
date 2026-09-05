import Link from "next/link";
import { Mail, Paperclip, Clock, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Deal } from "@/types";

interface DealCardProps {
  deal: Deal;
  onDragStart?: (e: React.DragEvent, dealId: string) => void;
}

export function DealCard({ deal, onDragStart }: DealCardProps) {
  return (
    <Card
      draggable
      onDragStart={(e) => onDragStart?.(e, deal.id)}
      className="cursor-grab border-border shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing"
    >
      <CardContent className="space-y-3 p-4">
        <div>
          <p className="text-xs font-medium text-muted-foreground">{deal.customerName}</p>
          <Link href={`/deals/${deal.id}`} className="font-semibold hover:underline">
            {deal.title}
          </Link>
        </div>
        <p className="text-lg font-bold">{formatCurrency(deal.value)}</p>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{deal.owner}</span>
          <span>Expected: {formatDate(deal.expectedClose)}</span>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Mail className="h-3 w-3" />
            {deal.emailCount} emails
          </span>
          {deal.poStatus && (
            <span className="flex items-center gap-1">
              <Paperclip className="h-3 w-3" />
              {deal.poStatus}
            </span>
          )}
          {deal.followUpStatus && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {deal.followUpStatus}
            </span>
          )}
        </div>
        {deal.aiInsight && (
          <Badge variant="ai" className="gap-1">
            <Sparkles className="h-3 w-3" />
            AI Insight: {deal.aiInsight}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}
