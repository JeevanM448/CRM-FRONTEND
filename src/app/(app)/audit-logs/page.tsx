"use client";

import { useMemo, useState } from "react";
import { FileText, ShieldAlert } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { KpiCard } from "@/components/ui/kpi-card";
import { SearchBar } from "@/components/ui/search-bar";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Dialog,
  DialogContent,
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
import { formatDateTime } from "@/lib/utils";
import { useCRMStore, usePermissions } from "@/store/CRMStoreProvider";
import {
  AUDIT_ACTION_LABELS,
  AUDIT_ENTITY_LABELS,
  type AuditLogView,
} from "@/store/auditLogs";
import type { AuditAction, AuditEntityType } from "@/store/types";

function formatAuditValue(value?: Record<string, unknown>) {
  if (!value || Object.keys(value).length === 0) return "—";
  return JSON.stringify(value, null, 2);
}

export default function AuditLogsPage() {
  const { canViewAuditLogs } = usePermissions();
  const { getAuditLogViews, getAuditLogSummary } = useCRMStore();
  const logs = getAuditLogViews();
  const summary = getAuditLogSummary();

  const [search, setSearch] = useState("");
  const [action, setAction] = useState("all");
  const [entityType, setEntityType] = useState("all");
  const [actorId, setActorId] = useState("all");
  const [selected, setSelected] = useState<AuditLogView | undefined>();

  const actors = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    for (const log of logs) {
      if (!map.has(log.actorId)) {
        map.set(log.actorId, { id: log.actorId, name: log.actorName });
      }
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [logs]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return logs.filter((item) => {
      const matchesSearch =
        item.actorName.toLowerCase().includes(q) ||
        item.actorEmail.toLowerCase().includes(q) ||
        item.action.toLowerCase().includes(q) ||
        item.entityType.toLowerCase().includes(q) ||
        item.entityId.toLowerCase().includes(q) ||
        AUDIT_ACTION_LABELS[item.action].toLowerCase().includes(q) ||
        AUDIT_ENTITY_LABELS[item.entityType].toLowerCase().includes(q);
      const matchesAction = action === "all" || item.action === action;
      const matchesEntity = entityType === "all" || item.entityType === entityType;
      const matchesActor = actorId === "all" || item.actorId === actorId;
      return matchesSearch && matchesAction && matchesEntity && matchesActor;
    });
  }, [logs, search, action, entityType, actorId]);

  if (!canViewAuditLogs) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="Access restricted"
        description="Only administrators can view organization audit logs."
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Logs"
        description="Track important activity across your organization"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total Events" value={String(summary.total)} />
        <KpiCard label="Today" value={String(summary.today)} />
        <KpiCard label="This Week" value={String(summary.thisWeek)} />
        <KpiCard label="Approval / Important Events" value={String(summary.important)} />
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap">
        <SearchBar
          placeholder="Search user, action, entity, or ID"
          value={search}
          onChange={setSearch}
          className="lg:max-w-sm"
        />
        <Select value={action} onValueChange={setAction}>
          <SelectTrigger className="w-full lg:w-44">
            <SelectValue placeholder="Action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All actions</SelectItem>
            {(Object.keys(AUDIT_ACTION_LABELS) as AuditAction[]).map((key) => (
              <SelectItem key={key} value={key}>
                {AUDIT_ACTION_LABELS[key]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={entityType} onValueChange={setEntityType}>
          <SelectTrigger className="w-full lg:w-48">
            <SelectValue placeholder="Entity type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All entities</SelectItem>
            {(Object.keys(AUDIT_ENTITY_LABELS) as AuditEntityType[]).map((key) => (
              <SelectItem key={key} value={key}>
                {AUDIT_ENTITY_LABELS[key]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={actorId} onValueChange={setActorId}>
          <SelectTrigger className="w-full lg:w-48">
            <SelectValue placeholder="Actor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All actors</SelectItem>
            {actors.map((actor) => (
              <SelectItem key={actor.id} value={actor.id}>
                {actor.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No audit logs found"
          description="No events match this search or filter."
        />
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {filtered.map((item) => (
              <Card
                key={item.id}
                className="cursor-pointer p-4"
                onClick={() => setSelected(item)}
              >
                <p className="text-xs text-muted-foreground">{formatDateTime(item.timestamp)}</p>
                <p className="mt-1 font-medium">{item.actorName}</p>
                <p className="text-sm text-muted-foreground">
                  {AUDIT_ACTION_LABELS[item.action]} · {AUDIT_ENTITY_LABELS[item.entityType]}
                </p>
                <p className="mt-1 text-sm break-all">{item.entityId}</p>
              </Card>
            ))}
          </div>

          <Card className="hidden overflow-hidden md:block">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date &amp; Time</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Entity ID</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((item) => (
                    <TableRow
                      key={item.id}
                      className="cursor-pointer"
                      onClick={() => setSelected(item)}
                    >
                      <TableCell>{formatDateTime(item.timestamp)}</TableCell>
                      <TableCell>
                        <p className="font-medium">{item.actorName}</p>
                        <p className="text-xs text-muted-foreground break-all">{item.actorEmail}</p>
                      </TableCell>
                      <TableCell>{AUDIT_ACTION_LABELS[item.action]}</TableCell>
                      <TableCell>{AUDIT_ENTITY_LABELS[item.entityType]}</TableCell>
                      <TableCell className="max-w-[140px] truncate">{item.entityId}</TableCell>
                      <TableCell className="max-w-xs truncate text-muted-foreground">
                        {item.metadata?.title
                          ? String(item.metadata.title)
                          : item.newValue?.name
                            ? String(item.newValue.name)
                            : item.newValue?.status
                              ? String(item.newValue.status)
                              : "View details"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </>
      )}

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(undefined)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Audit event details</DialogTitle>
          </DialogHeader>
          {selected ? (
            <div className="space-y-4 text-sm">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-muted-foreground">Actor</p>
                  <p className="font-medium">{selected.actorName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Actor email</p>
                  <p className="font-medium break-all">{selected.actorEmail}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Action</p>
                  <p className="font-medium">{AUDIT_ACTION_LABELS[selected.action]}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Entity type</p>
                  <p className="font-medium">{AUDIT_ENTITY_LABELS[selected.entityType]}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Entity ID</p>
                  <p className="font-medium break-all">{selected.entityId}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Timestamp</p>
                  <p className="font-medium">{formatDateTime(selected.timestamp)}</p>
                </div>
              </div>
              <div>
                <p className="mb-2 text-muted-foreground">Previous value</p>
                <pre className="overflow-x-auto rounded-xl bg-muted/50 p-3 text-xs">
                  {formatAuditValue(selected.previousValue)}
                </pre>
              </div>
              <div>
                <p className="mb-2 text-muted-foreground">New value</p>
                <pre className="overflow-x-auto rounded-xl bg-muted/50 p-3 text-xs">
                  {formatAuditValue(selected.newValue)}
                </pre>
              </div>
              <div>
                <p className="mb-2 text-muted-foreground">Metadata</p>
                <pre className="overflow-x-auto rounded-xl bg-muted/50 p-3 text-xs">
                  {formatAuditValue(selected.metadata)}
                </pre>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
