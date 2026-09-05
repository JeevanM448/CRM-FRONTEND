"use client";

import { useSearchParams } from "next/navigation";
import { ArrowLeft, Plus, Sparkles, Reply, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { KpiCard } from "@/components/ui/kpi-card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { AIAssistPanel } from "@/components/email/ai-assist-panel";
import { EmailList } from "@/components/email/email-list";
import { ComposeEmailDialog, FollowUpFormDialog } from "@/components/email/compose-email-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SearchBar } from "@/components/ui/search-bar";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useCRMStore, usePermissions } from "@/store/CRMStoreProvider";
import { emailService } from "@/services";
import type { EmailThread } from "@/types";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const folders = [
  { id: "inbox", label: "Inbox", filter: (e: EmailThread) => e.folder === "inbox" },
  { id: "important", label: "Important", filter: (e: EmailThread) => e.important },
  { id: "follow-ups", label: "Follow-ups", filter: (e: EmailThread) => e.folder === "follow-ups" },
  { id: "sent", label: "Sent", filter: (e: EmailThread) => e.folder === "sent" },
  { id: "drafts", label: "Drafts", filter: (e: EmailThread) => e.folder === "drafts" },
] as const;

function resolveEmailOwnerId(
  email: EmailThread,
  deals: { id: string; ownerId: string }[],
  customers: { id: string; ownerId: string }[]
): string | undefined {
  if (email.dealId) return deals.find((d) => d.id === email.dealId)?.ownerId;
  if (email.customerId) return customers.find((c) => c.id === email.customerId)?.ownerId;
  return undefined;
}

export default function InboxPageContent() {
  const searchParams = useSearchParams();
  const initialFolder = (searchParams.get("folder") as (typeof folders)[number]["id"]) || "inbox";
  const threadParam = searchParams.get("thread");
  const {
    getEmails,
    markEmailRead,
    getDeals,
    getCustomers,
    getTeamDealOwners,
    getTeamInboxSummary,
    getEmailAccessStatus,
  } = useCRMStore();
  const { canEdit, role } = usePermissions();
  const isManager = role === "sales_manager";
  const teamOwners = isManager ? getTeamDealOwners() : [];
  const inboxSummary = isManager ? getTeamInboxSummary() : null;
  const deals = getDeals();
  const customers = getCustomers();

  const [folder, setFolder] = useState<(typeof folders)[number]["id"]>(initialFolder);
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [mobileView, setMobileView] = useState<"list" | "detail">("list");
  const [aiOpen, setAiOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [ownerId, setOwnerId] = useState("all");
  const [customerFilter, setCustomerFilter] = useState("all");
  const [dealFilter, setDealFilter] = useState("all");
  const [composeOpen, setComposeOpen] = useState(false);
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const [replyDefaults, setReplyDefaults] = useState<{ to?: string; subject?: string; customerId?: string; dealId?: string }>({});
  const [linkDealId, setLinkDealId] = useState("");

  const allEmails = getEmails();

  const threadAccess = threadParam ? getEmailAccessStatus(threadParam) : "allowed";

  useEffect(() => {
    if (!threadParam || threadAccess !== "allowed") return;
    setSelectedId(threadParam);
    markEmailRead(threadParam);
    setMobileView("detail");
  }, [threadParam, threadAccess, markEmailRead]);

  const filtered = useMemo(() => {
    const f = folders.find((x) => x.id === folder);
    let emails = f ? allEmails.filter(f.filter) : allEmails;
    if (search) {
      const q = search.toLowerCase();
      emails = emails.filter(
        (e) =>
          e.subject.toLowerCase().includes(q) ||
          e.from.toLowerCase().includes(q) ||
          e.preview.toLowerCase().includes(q)
      );
    }
    if (priorityFilter !== "all") {
      emails = emails.filter((e) => e.priority === priorityFilter);
    }
    if (isManager && ownerId !== "all") {
      emails = emails.filter((e) => resolveEmailOwnerId(e, deals, customers) === ownerId);
    }
    if (customerFilter !== "all") {
      emails = emails.filter((e) => e.customerId === customerFilter);
    }
    if (dealFilter !== "all") {
      emails = emails.filter((e) => e.dealId === dealFilter);
    }
    return emails;
  }, [allEmails, folder, search, priorityFilter, isManager, ownerId, customerFilter, dealFilter, deals, customers]);

  const selected = useMemo(() => {
    const candidateId = selectedId ?? filtered[0]?.id;
    if (!candidateId) return undefined;
    if (getEmailAccessStatus(candidateId) === "denied") return undefined;
    return allEmails.find((e) => e.id === candidateId);
  }, [selectedId, filtered, allEmails, getEmailAccessStatus]);

  function handleSelect(id: string) {
    if (getEmailAccessStatus(id) === "denied") return;
    setSelectedId(id);
    markEmailRead(id);
    setMobileView("detail");
  }

  function handleFolderChange(value: (typeof folders)[number]["id"]) {
    setFolder(value);
    setSelectedId(undefined);
    setMobileView("list");
  }

  async function handleLinkDeal() {
    if (!selected || !linkDealId) return;
    await emailService.linkEmailToDeal(selected.id, linkDealId);
    toast.success("Email linked to deal");
  }

  if (threadParam && threadAccess === "denied") {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="Access restricted"
        description="This email thread is outside your team scope. This is a frontend navigation check only, not production authorization."
      />
    );
  }

  const pageTitle =
    role === "salesperson" ? "My Inbox" : isManager ? "Team Inbox" : "Inbox";
  const pageDescription = isManager
    ? "View CRM-linked email activity across your team's customer accounts."
    : "CRM-integrated email workspace";

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">{pageTitle}</h1>
          <p className="text-sm text-muted-foreground">{pageDescription}</p>
        </div>
        {canEdit && (
          <Button variant="accent" className="w-full sm:w-auto" onClick={() => setComposeOpen(true)}>
            <Plus className="h-4 w-4" />
            Compose
          </Button>
        )}
      </div>

      {isManager && inboxSummary ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Team Emails" value={String(inboxSummary.totalEmails)} featured />
          <KpiCard label="Unread" value={String(inboxSummary.unreadCount)} />
          <KpiCard label="Important" value={String(inboxSummary.importantCount)} />
          <KpiCard label="Linked Deals" value={String(inboxSummary.linkedDeals)} />
        </div>
      ) : null}

      <div className="flex flex-col gap-3 lg:hidden">
        <Select value={folder} onValueChange={(v) => handleFolderChange(v as (typeof folders)[number]["id"])}>
          <SelectTrigger>
            <SelectValue placeholder="Folder" />
          </SelectTrigger>
          <SelectContent>
            {folders.map((f) => (
              <SelectItem key={f.id} value={f.id}>
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex min-h-[calc(100dvh-12rem)] flex-col gap-4 lg:min-h-[calc(100vh-11rem)] lg:flex-row">
        <Card className="hidden w-48 shrink-0 lg:block">
          <CardContent className="p-2">
            {folders.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => handleFolderChange(f.id)}
                className={cn(
                  "w-full rounded-lg px-3 py-2 text-left text-sm transition-colors",
                  folder === f.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                )}
              >
                {f.label}
              </button>
            ))}
          </CardContent>
        </Card>

        <Card
          className={cn(
            "flex w-full flex-col lg:w-80 lg:shrink-0",
            mobileView === "detail" && "hidden lg:flex"
          )}
        >
          <CardContent className="space-y-3 border-b p-3">
            <SearchBar placeholder="Search emails..." value={search} onChange={setSearch} />
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            {isManager ? (
              <Select value={ownerId} onValueChange={setOwnerId}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Salesperson" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Team Members</SelectItem>
                  {teamOwners.map((owner) => (
                    <SelectItem key={owner.id} value={owner.id}>{owner.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}
            <Select value={customerFilter} onValueChange={setCustomerFilter}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Customer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Customers</SelectItem>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={dealFilter} onValueChange={setDealFilter}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Deal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Deals</SelectItem>
                {deals.map((d) => (
                  <SelectItem key={d.id} value={d.id}>{d.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
          <ScrollArea className="flex-1">
            {filtered.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                {isManager ? "No team emails match your filters." : "No emails match your filters."}
              </div>
            ) : (
              <EmailList emails={filtered} selectedId={selected?.id} onSelect={handleSelect} />
            )}
          </ScrollArea>
        </Card>

        <Card
          className={cn(
            "flex min-w-0 flex-1 flex-col",
            mobileView === "list" && "hidden lg:flex"
          )}
        >
          {selected ? (
            <>
              <CardContent className="border-b p-4 sm:p-5">
                <div className="mb-3 flex items-center gap-2 lg:hidden">
                  <Button variant="ghost" size="sm" className="-ml-2" onClick={() => setMobileView("list")}>
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </Button>
                  <Button variant="outline" size="sm" className="ml-auto xl:hidden" onClick={() => setAiOpen(true)}>
                    <Sparkles className="h-4 w-4" />
                    AI Assist
                  </Button>
                </div>
                <h2 className="text-base font-semibold sm:text-lg">{selected.subject}</h2>
                <p className="mt-1 text-sm text-muted-foreground">From: {selected.from}</p>
                <div className="mt-4 grid gap-3 rounded-xl bg-muted/40 p-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Customer</p>
                    <p className="text-sm font-medium">{selected.customerName ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Deal</p>
                    <p className="text-sm font-medium">{selected.dealTitle ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">PO</p>
                    <p className="text-sm font-medium">{selected.poNumber ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Priority</p>
                    {selected.priority ? <StatusBadge status={selected.priority} type="priority" /> : "—"}
                  </div>
                </div>
              </CardContent>
              <CardContent className="flex-1 overflow-auto p-4 sm:p-5">
                {selected.messages?.map((msg) => (
                  <div key={msg.id} className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                    {msg.body}
                  </div>
                )) ?? <p className="text-sm text-muted-foreground">{selected.preview}</p>}
                {canEdit && (
                  <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full sm:w-auto"
                      onClick={() => {
                        setReplyDefaults({
                          to: selected.fromEmail || selected.from,
                          subject: selected.subject.startsWith("Re:") ? selected.subject : `Re: ${selected.subject}`,
                          customerId: selected.customerId,
                          dealId: selected.dealId,
                        });
                        setComposeOpen(true);
                      }}
                    >
                      <Reply className="h-4 w-4" />
                      Reply
                    </Button>
                    <Select value={linkDealId} onValueChange={setLinkDealId}>
                      <SelectTrigger className="w-full sm:w-[200px]">
                        <SelectValue placeholder="Link to deal" />
                      </SelectTrigger>
                      <SelectContent>
                        {deals.map((d) => (
                          <SelectItem key={d.id} value={d.id}>
                            {d.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={handleLinkDeal}>
                      Link to Deal
                    </Button>
                    <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => setFollowUpOpen(true)}>
                      Create Follow-up
                    </Button>
                    {selected.folder === "drafts" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-destructive sm:w-auto"
                        onClick={async () => {
                          await emailService.deleteEmail(selected.id);
                          setMobileView("list");
                          toast.success("Draft deleted");
                        }}
                      >
                        Delete Draft
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </>
          ) : (
            <CardContent className="flex flex-1 items-center justify-center p-8 text-muted-foreground">
              Select an email to read
            </CardContent>
          )}
        </Card>

        <div className="hidden w-80 shrink-0 xl:block">
          <AIAssistPanel email={selected} />
        </div>
      </div>

      <Sheet open={aiOpen} onOpenChange={setAiOpen}>
        <SheetContent side="bottom" className="h-[85vh] overflow-y-auto rounded-t-2xl">
          <SheetHeader className="mb-4 text-left">
            <SheetTitle>AI Email Assist</SheetTitle>
          </SheetHeader>
          <AIAssistPanel email={selected} />
        </SheetContent>
      </Sheet>

      <ComposeEmailDialog
        open={composeOpen}
        onOpenChange={setComposeOpen}
        defaultTo={replyDefaults.to}
        defaultSubject={replyDefaults.subject}
        defaultCustomerId={replyDefaults.customerId}
        defaultDealId={replyDefaults.dealId}
      />
      <FollowUpFormDialog
        open={followUpOpen}
        onOpenChange={setFollowUpOpen}
        defaultCustomerId={selected?.customerId}
        defaultDealId={selected?.dealId}
        initialValues={{ title: selected ? `Follow up: ${selected.subject}` : undefined }}
      />
    </div>
  );
}
