"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { useCRMStore, usePermissions } from "@/store/CRMStoreProvider";
import { formatCurrency } from "@/lib/utils";

const GROUP_LABELS: Record<string, string> = {
  customer: "Customers",
  contact: "Contacts",
  deal: "Deals",
  po: "Purchase Orders",
  employee: "Employees",
  "follow-up": "Follow-ups",
  email: "Emails",
  document: "Documents",
  activity: "Activities",
};

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading search...</div>}>
      <SearchPageContent />
    </Suspense>
  );
}

function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";
  const { canSearchOrganization, role } = usePermissions();
  const { searchGrouped } = useCRMStore();
  const [query, setQuery] = useState(initialQuery);

  const groups = useMemo(() => searchGrouped(query), [query, searchGrouped]);
  const isManager = role === "sales_manager";

  if (!canSearchOrganization) {
    return (
      <EmptyState
        icon={Search}
        title="Search unavailable"
        description="You do not have permission to search organization records."
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={isManager ? "Team Search" : role === "salesperson" ? "My Search" : "Search"}
        description={
          role === "admin"
            ? "Search customers, deals, purchase orders, employees, and more across the organization."
            : isManager
              ? "Search within your team's permitted CRM records."
              : "Search within your permitted CRM records."
        }
      />

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="h-11 rounded-full pl-9"
          placeholder="Search customers, deals, POs, employees..."
          value={query}
          onChange={(e) => {
            const value = e.target.value;
            setQuery(value);
            router.replace(value ? `/search?q=${encodeURIComponent(value)}` : "/search");
          }}
        />
      </div>

      {!query.trim() ? (
        <EmptyState
          icon={Search}
          title="Start searching"
          description="Enter a name, email, deal title, PO number, or ID."
        />
      ) : groups.length === 0 ? (
        <EmptyState icon={Search} title="No results" description={`No matches found for "${query}".`} />
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <Card key={group.type}>
              <CardHeader>
                <CardTitle>{GROUP_LABELS[group.type] ?? group.type}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {group.items.map((item) => (
                  <Link
                    key={`${group.type}-${item.id}`}
                    href={item.href}
                    className="flex flex-col gap-1 rounded-xl border border-border p-4 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.subtitle}</p>
                      {item.detail ? (
                        <p className="text-xs text-muted-foreground">{item.detail}</p>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2">
                      {group.type === "deal" && item.detail ? (
                        <span className="text-sm font-medium">
                          {formatCurrency(Number(item.detail) || 0)}
                        </span>
                      ) : null}
                      {item.status ? <StatusBadge status={item.status} /> : null}
                      <span className="text-xs uppercase text-muted-foreground">{group.type}</span>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
