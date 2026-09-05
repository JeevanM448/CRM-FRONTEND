"use client";

import { cn } from "@/lib/utils";
import type { EmailThread } from "@/types";
import { formatDateTime } from "@/lib/utils";

interface EmailListProps {
  emails: EmailThread[];
  selectedId?: string;
  onSelect: (id: string) => void;
}

export function EmailList({ emails, selectedId, onSelect }: EmailListProps) {
  if (emails.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-sm text-muted-foreground">
        No emails in this folder.
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {emails.map((email) => (
        <button
          key={email.id}
          type="button"
          onClick={() => onSelect(email.id)}
          className={cn(
            "w-full px-4 py-3 text-left transition-colors hover:bg-muted/50",
            selectedId === email.id && "bg-muted/70",
            !email.read && "bg-purple-50/30"
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <p className={cn("text-sm", !email.read && "font-semibold")}>{email.from}</p>
            <span className="shrink-0 text-xs text-muted-foreground">
              {formatDateTime(email.date)}
            </span>
          </div>
          <p className={cn("mt-0.5 truncate text-sm", !email.read && "font-medium")}>
            {email.subject}
          </p>
          <p className="mt-1 truncate text-xs text-muted-foreground">{email.preview}</p>
        </button>
      ))}
    </div>
  );
}
