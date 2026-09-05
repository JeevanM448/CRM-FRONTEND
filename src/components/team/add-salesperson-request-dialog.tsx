"use client";

import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/ui/search-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { teamRequestService } from "@/services";
import { useCRMStore, useCurrentUser } from "@/store/CRMStoreProvider";
import type { TeamRequestCandidate } from "@/store/teamRequests";
import { Search, UserRound } from "lucide-react";
import { toast } from "sonner";

interface AddSalespersonRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddSalespersonRequestDialog({
  open,
  onOpenChange,
}: AddSalespersonRequestDialogProps) {
  const user = useCurrentUser();
  const { searchSalespeopleForTeamRequest } = useCRMStore();
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const results = useMemo(
    () => (open ? searchSalespeopleForTeamRequest(query) : []),
    [open, query, searchSalespeopleForTeamRequest]
  );
  const selected = results.find((item) => item.id === selectedId);

  function handleOpenChange(next: boolean) {
    onOpenChange(next);
    if (!next) {
      setQuery("");
      setSelectedId(null);
      setConfirmOpen(false);
    }
  }

  async function sendRequest() {
    if (!selected || selected.eligibility !== "eligible") return;
    setLoading(true);
    try {
      await teamRequestService.createTeamRequest(selected.id);
      toast.success("Team request sent to Admin.");
      handleOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to send team request");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add salesperson</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Search existing salespeople by name or email. Admin approval is required before anyone
            joins your team.
          </p>
          <SearchBar
            placeholder="Search name or email"
            value={query}
            onChange={(value) => {
              setQuery(value);
              setSelectedId(null);
            }}
          />
          <div className="max-h-72 space-y-2 overflow-y-auto">
            {!query.trim() ? (
              <EmptyState
                icon={Search}
                title="Search for a salesperson"
                description="Try a name or email, for example nina.patel@shinystone.com."
              />
            ) : results.length === 0 ? (
              <EmptyState
                icon={UserRound}
                title="No matching people"
                description="No users match that name or email."
              />
            ) : (
              results.map((item) => (
                <CandidateRow
                  key={item.id}
                  item={item}
                  selected={selectedId === item.id}
                  onSelect={() => setSelectedId(item.id)}
                />
              ))
            )}
          </div>
          {selected?.eligibilityMessage ? (
            <p className="text-sm text-destructive">{selected.eligibilityMessage}</p>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button
              variant="accent"
              disabled={!selected || selected.eligibility !== "eligible" || loading}
              onClick={() => setConfirmOpen(true)}
            >
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Request to add ${selected?.name ?? "this salesperson"} to your team?`}
        description={
          selected
            ? `${selected.name} (${selected.email}) will be requested for ${user?.name ?? "your team"}${user?.team ? ` · ${user.team}` : ""}. Admin must approve before the assignment changes.`
            : ""
        }
        confirmLabel="Send Request"
        onConfirm={() => {
          void sendRequest();
        }}
      />
    </>
  );
}

function CandidateRow({
  item,
  selected,
  onSelect,
}: {
  item: TeamRequestCandidate;
  selected: boolean;
  onSelect: () => void;
}) {
  const assignment = item.managerName
    ? `${item.team ?? "No team"} / ${item.managerName}`
    : item.team ?? "Unassigned";
  const roleLabel =
    item.role === "salesperson"
      ? "Salesperson"
      : item.role === "sales_manager"
        ? "Manager"
        : item.role === "admin"
          ? "Admin"
          : "Viewer";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-xl border p-3 text-left ${
        selected ? "border-primary bg-muted/60" : "border-border bg-card"
      }`}
    >
      <p className="font-medium">{item.name}</p>
      <p className="text-sm text-muted-foreground">{item.email}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {roleLabel} · {assignment}
      </p>
    </button>
  );
}
