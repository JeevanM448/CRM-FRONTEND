import { AlertCircle, LucideIcon, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  retryLabel?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = "Something went wrong",
  description = "We couldn't load this content. Please try again.",
  icon: Icon = AlertCircle,
  retryLabel = "Try again",
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/5 px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10">
        <Icon className="h-7 w-7 text-destructive" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>
      {onRetry && (
        <Button variant="outline" className="mt-6 gap-2" onClick={onRetry}>
          <RefreshCw className="h-4 w-4" />
          {retryLabel}
        </Button>
      )}
    </div>
  );
}
