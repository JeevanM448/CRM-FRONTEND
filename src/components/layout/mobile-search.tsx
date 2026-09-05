"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useCRMStore } from "@/store/CRMStoreProvider";

interface MobileSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileSearch({ open, onOpenChange }: MobileSearchProps) {
  const router = useRouter();
  const { search } = useCRMStore();
  const [query, setQuery] = useState("");

  const results = useMemo(() => (query.trim() ? search(query) : []), [query, search]);

  function navigate(href: string) {
    onOpenChange(false);
    setQuery("");
    router.push(href);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="top" className="h-auto max-h-[85vh] rounded-b-2xl px-4 pb-6 pt-6 [&>button]:hidden">
        <SheetHeader className="mb-4 text-left">
          <SheetTitle>Search</SheetTitle>
        </SheetHeader>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            placeholder="Search customers, deals, emails..."
            className="h-11 rounded-full pl-9 pr-10"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
              onClick={() => setQuery("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <ScrollArea className="mt-4 max-h-[50vh]">
          {query.trim() && results.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">No results found.</p>
          )}
          {results.map((r) => (
            <button
              key={`${r.type}-${r.id}`}
              type="button"
              className="flex w-full flex-col gap-0.5 border-b border-border px-1 py-3 text-left last:border-0 active:bg-muted/50"
              onClick={() => navigate(r.href)}
            >
              <span className="text-xs uppercase text-muted-foreground">{r.type}</span>
              <span className="font-medium">{r.title}</span>
              <span className="text-sm text-muted-foreground">{r.subtitle}</span>
            </button>
          ))}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
