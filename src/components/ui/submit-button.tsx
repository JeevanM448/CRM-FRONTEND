"use client";

import { Loader2 } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SubmitButtonProps extends ButtonProps {
  loading?: boolean;
  loadingText?: string;
}

export function SubmitButton({
  loading = false,
  loadingText = "Saving...",
  children,
  disabled,
  className,
  type = "submit",
  ...props
}: SubmitButtonProps) {
  return (
    <Button
      type={type}
      disabled={disabled || loading}
      className={cn("min-w-[7rem]", className)}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
