"use client";

import { useMemo, useState } from "react";
import { ClipboardList, ShieldAlert } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { SearchBar } from "@/components/ui/search-bar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RequestStatusBadge, RequestTypeBadge } from "@/components/team/team-request-badges";
import { formatDate } from "@/lib/utils";
import { useCRMStore, usePermissions } from "@/store/CRMStoreProvider";
import { teamRequestService } from "@/services";
import type { TeamRequestView } from "@/store/teamRequests";
import { toast } from "sonner";

export default function TeamRequestsPage() {
  const { canReviewTeamRequests } = usePermissions();
  const { getTeamRequestsForManager } = useCRMStore();
  const requests = getTeamRequestsForManager();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("pending");
  const [type, setType] = useState("all");
  const [approveTarget, setApproveTarget] = useState<TeamRequestView | undefined>();
  const [rejectTarget, setRejectTarget] = useState<TeamRequestView | undefined>();
  const [rejectionReason, setRejectionReason] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return requests.filter((item) => {
      const matchesSearch =
        item.salespersonName.toLowerCase().includes(q) ||
        item.salespersonEmail.toLowerCase().includes(q) ||
        item.managerName.toLowerCase().includes(q);
      const matchesStatus = status === "all" || item.status === status;
      const matchesType = type === "all" || item.type === type;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [requests, search, status, type]);

  if (!canReviewTeamRequests) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="Access restricted"
        description="Only administrators can review team requests."
      />
    );
  }

  async function handleApprove() {
    if (!approveTarget) return;
    try {
      const result = await teamRequestService.approveTeamRequest(approveTarget.id);
      if (result.status === "rejected") {
        toast.error(result.rejectionReason || "Request could not be approved");
      } else {
        toast.success(
          result.type === "remove" ? "Removal request approved" : "Add request approved"
        );
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to approve request");
    }
  }

  async function handleReject() {
    if (!rejectTarget) return;
    try {
      await teamRequestService.rejectTeamRequest(rejectTarget.id, rejectionReason);
      toast.success("Request rejected");
      setRejectTarget(undefined);
      setRejectionReason("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to reject request");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team Requests"
        description="Review manager requests to add or remove salespeople from teams."
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap">
        <SearchBar
          placeholder="Search salesperson or manager"
          value={search}
          onChange={setSearch}
          className="lg:max-w-sm"
        />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-full lg:w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-full lg:w-44">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="add">Add</SelectItem>
            <SelectItem value="remove">Remove</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No team requests"
          description="No requests match this search or filter."
        />
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {filtered.map((item) => (
              <RequestCard
                key={item.id}
                item={item}
                onApprove={() => setApproveTarget(item)}
                onReject={() => {
                  setRejectionReason("");
                  setRejectTarget(item);
                }}
              />
            ))}
          </div>
          <Card className="hidden overflow-hidden md:block">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Salesperson</TableHead>
                    <TableHead>Requested by</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <RequestTypeBadge type={item.type} />
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{item.salespersonName}</p>
                        <p className="text-xs text-muted-foreground">{item.salespersonEmail}</p>
                      </TableCell>
                      <TableCell>
                        <p>{item.managerName}</p>
                        <p className="text-xs text-muted-foreground">{item.managerTeam ?? "—"}</p>
                      </TableCell>
                      <TableCell>
                        <p>{formatDate(item.createdAt)}</p>
                        {item.reviewedAt ? (
                          <p className="text-xs text-muted-foreground">
                            Reviewed {formatDate(item.reviewedAt)}
                          </p>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <RequestStatusBadge status={item.status} />
                        {item.rejectionReason ? (
                          <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                            {item.rejectionReason}
                          </p>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        {item.status === "pending" ? (
                          <div className="flex flex-wrap gap-2">
                            <Button size="sm" variant="accent" onClick={() => setApproveTarget(item)}>
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setRejectionReason("");
                                setRejectTarget(item);
                              }}
                            >
                              Reject
                            </Button>
                          </div>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </>
      )}

      <ConfirmDialog
        open={Boolean(approveTarget)}
        onOpenChange={(open) => {
          if (!open) setApproveTarget(undefined);
        }}
        title={
          approveTarget?.type === "remove"
            ? `Approve removal of ${approveTarget.salespersonName}?`
            : `Approve adding ${approveTarget?.salespersonName ?? "this salesperson"}?`
        }
        description={
          approveTarget?.type === "remove"
            ? `${approveTarget.salespersonName} will be unassigned from ${approveTarget.managerName}${approveTarget.managerTeam ? ` · ${approveTarget.managerTeam}` : ""}. Historical records stay in place.`
            : `${approveTarget?.salespersonName} will join ${approveTarget?.managerName}${approveTarget?.managerTeam ? ` · ${approveTarget.managerTeam}` : ""}.`
        }
        confirmLabel="Approve"
        onConfirm={() => {
          void handleApprove();
        }}
      />

      <Dialog
        open={Boolean(rejectTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setRejectTarget(undefined);
            setRejectionReason("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject request?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {rejectTarget
              ? `${rejectTarget.salespersonName} will not be ${rejectTarget.type === "remove" ? "removed from" : "added to"} ${rejectTarget.managerName}'s team.`
              : ""}
          </p>
          <div className="space-y-2">
            <Label>Please provide a reason for rejecting this request.</Label>
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Optional reason"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setRejectTarget(undefined);
                setRejectionReason("");
              }}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => void handleReject()}>
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RequestCard({
  item,
  onApprove,
  onReject,
}: {
  item: TeamRequestView;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <RequestTypeBadge type={item.type} />
        <RequestStatusBadge status={item.status} />
      </div>
      <p className="mt-3 font-medium">{item.salespersonName}</p>
      <p className="text-sm text-muted-foreground">{item.salespersonEmail}</p>
      <p className="mt-2 text-sm">
        Requested by {item.managerName}
        {item.managerTeam ? ` · ${item.managerTeam}` : ""}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">Requested {formatDate(item.createdAt)}</p>
      {item.reviewedAt ? (
        <p className="text-xs text-muted-foreground">Reviewed {formatDate(item.reviewedAt)}</p>
      ) : null}
      {item.rejectionReason ? (
        <p className="mt-2 text-sm text-muted-foreground">{item.rejectionReason}</p>
      ) : null}
      {item.status === "pending" ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" variant="accent" onClick={onApprove}>
            Approve
          </Button>
          <Button size="sm" variant="outline" onClick={onReject}>
            Reject
          </Button>
        </div>
      ) : null}
    </Card>
  );
}
