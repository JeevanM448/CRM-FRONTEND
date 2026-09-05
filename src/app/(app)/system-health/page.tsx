"use client";

import { useState } from "react";
import { Activity, Eye, RefreshCw, Shield } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { KpiCard } from "@/components/ui/kpi-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDateTime } from "@/lib/utils";
import { useCRMStore, usePermissions } from "@/store/CRMStoreProvider";
import { systemHealthService } from "@/services";
import {
  HEALTH_CATEGORY_LABELS,
  HEALTH_STATUS_LABELS,
  type HealthStatusId,
} from "@/store/systemHealth";

function overallLabel(status: HealthStatusId) {
  if (status === "HEALTHY") return "Healthy";
  if (status === "DEGRADED") return "Degraded";
  if (status === "DOWN") return "Critical";
  return "Unknown";
}

function statusVariant(status: HealthStatusId): "default" | "secondary" | "danger" | "outline" {
  if (status === "HEALTHY") return "default";
  if (status === "DEGRADED") return "secondary";
  if (status === "DOWN") return "danger";
  return "outline";
}

export default function SystemHealthPage() {
  const { canViewSystemHealth, canManageSystemHealth } = usePermissions();
  const { getHealthServices, getSystemHealth, getHealthHistory, getIncidents } = useCRMStore();

  const [tab, setTab] = useState("services");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [checking, setChecking] = useState<string | null>(null);
  const [historyService, setHistoryService] = useState<string>("all");
  const [historyStatus, setHistoryStatus] = useState<HealthStatusId | "all">("all");

  const services = getHealthServices();
  const summary = getSystemHealth();
  const incidents = getIncidents();
  const history = getHealthHistory(
    historyService === "all" ? undefined : historyService,
    { status: historyStatus }
  );

  const detail = services.find((s) => s.id === detailId);
  const detailHistory = detailId ? getHealthHistory(detailId) : [];

  async function handleCheckNow(id: string) {
    setChecking(id);
    try {
      await systemHealthService.checkHealth(id);
      toast.success("Mock health check completed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Check failed");
    } finally {
      setChecking(null);
    }
  }

  if (!canViewSystemHealth) {
    return (
      <EmptyState
        icon={Shield}
        title="Access restricted"
        description="System health monitoring is available to administrators only."
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Health"
        description="Monitor application services, integrations, and operational readiness."
      />

      <Card className="border-dashed border-warning/40 bg-warning/5">
        <CardContent className="flex items-start gap-3 p-4 text-sm">
          <Activity className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <p>
            Health statuses are <strong>mock/readiness only</strong>. No live infrastructure probes
            are performed. Future backend will call real service health APIs.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard label="Overall Status" value={overallLabel(summary.overallStatus)} subValue="Mock aggregate" />
        <KpiCard label="Healthy Services" value={String(summary.healthyCount)} />
        <KpiCard label="Degraded" value={String(summary.degradedCount)} />
        <KpiCard label="Failed / Down" value={String(summary.downCount)} />
        <KpiCard label="Last Checked" value={formatDateTime(summary.lastUpdatedAt)} subValue="Mock timestamp" />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex h-auto flex-wrap gap-1">
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
        </TabsList>

        <TabsContent value="services" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Service Status</CardTitle></CardHeader>
            <CardContent>
              <div className="hidden overflow-x-auto lg:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Latency</TableHead>
                      <TableHead>Last Checked</TableHead>
                      <TableHead>Environment</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {services.map((service) => (
                      <TableRow key={service.id}>
                        <TableCell>
                          <div className="font-medium">{service.name}</div>
                          <div className="text-xs text-muted-foreground">{service.version ?? "—"}</div>
                        </TableCell>
                        <TableCell>{HEALTH_CATEGORY_LABELS[service.category]}</TableCell>
                        <TableCell>
                          <Badge variant={statusVariant(service.status)}>
                            {HEALTH_STATUS_LABELS[service.status]}
                          </Badge>
                        </TableCell>
                        <TableCell>{service.latencyMs ? `${service.latencyMs}ms` : "—"}</TableCell>
                        <TableCell>{formatDateTime(service.lastCheckedAt)}</TableCell>
                        <TableCell>{service.environment}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="sm" variant="ghost" onClick={() => setDetailId(service.id)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            {canManageSystemHealth && (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={checking === service.id}
                                onClick={() => handleCheckNow(service.id)}
                              >
                                <RefreshCw className="mr-1 h-3 w-3" />
                                Check Now
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="space-y-3 lg:hidden">
                {services.map((service) => (
                  <Card key={service.id}>
                    <CardContent className="space-y-2 p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{service.name}</p>
                          <p className="text-xs text-muted-foreground">{HEALTH_CATEGORY_LABELS[service.category]}</p>
                        </div>
                        <Badge variant={statusVariant(service.status)}>
                          {HEALTH_STATUS_LABELS[service.status]}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => setDetailId(service.id)}>Details</Button>
                        {canManageSystemHealth && (
                          <Button size="sm" variant="outline" onClick={() => handleCheckNow(service.id)}>
                            Check Now
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-4 space-y-4">
          <div className="flex flex-wrap gap-3">
            <Select value={historyService} onValueChange={setHistoryService}>
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="Service" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All services</SelectItem>
                {services.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={historyStatus} onValueChange={(v) => setHistoryStatus(v as HealthStatusId | "all")}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {Object.entries(HEALTH_STATUS_LABELS).map(([id, label]) => (
                  <SelectItem key={id} value={id}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Card>
            <CardContent className="p-0">
              {history.length === 0 ? (
                <EmptyState icon={Activity} title="No health history" description="Run a mock check to create history." />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Latency</TableHead>
                      <TableHead>Message</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>{formatDateTime(record.checkedAt)}</TableCell>
                        <TableCell>{services.find((s) => s.id === record.serviceId)?.name ?? record.serviceId}</TableCell>
                        <TableCell>{HEALTH_STATUS_LABELS[record.status]}</TableCell>
                        <TableCell>{record.latencyMs ? `${record.latencyMs}ms` : "—"}</TableCell>
                        <TableCell className="text-muted-foreground">{record.message ?? "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="incidents" className="mt-4">
          <Card>
            <CardContent className="space-y-3 p-4">
              {incidents.length === 0 ? (
                <EmptyState icon={Activity} title="No incidents" description="No open incidents in mock data." />
              ) : (
                incidents.map((incident) => (
                  <div key={incident.id} className="rounded-md border p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{incident.severity}</Badge>
                      <Badge variant="secondary">{incident.status}</Badge>
                    </div>
                    <p className="mt-2 font-medium">{incident.title}</p>
                    <p className="text-sm text-muted-foreground">{incident.description}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Started {formatDateTime(incident.startedAt)}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!detailId} onOpenChange={() => setDetailId(null)}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          {detail && (
            <>
              <DialogHeader>
                <DialogTitle>{detail.name}</DialogTitle>
                <DialogDescription>{detail.description}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                <div className="flex flex-wrap gap-2">
                  <Badge variant={statusVariant(detail.status)}>{HEALTH_STATUS_LABELS[detail.status]}</Badge>
                  <Badge variant="outline">Mock status</Badge>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <p><span className="text-muted-foreground">Last check:</span> {formatDateTime(detail.lastCheckedAt)}</p>
                  <p><span className="text-muted-foreground">Latency:</span> {detail.latencyMs ? `${detail.latencyMs}ms` : "—"}</p>
                  <p><span className="text-muted-foreground">Version:</span> {detail.version ?? "—"}</p>
                  <p><span className="text-muted-foreground">Environment:</span> {detail.environment}</p>
                </div>
                {detail.details && <p className="text-muted-foreground">{detail.details}</p>}
                {detail.dependencies && detail.dependencies.length > 0 && (
                  <div>
                    <p className="font-medium">Dependencies</p>
                    <p className="text-muted-foreground">{detail.dependencies.join(", ")}</p>
                  </div>
                )}
                {detailHistory.length > 0 && (
                  <div>
                    <p className="mb-2 font-medium">Recent checks</p>
                    {detailHistory.slice(0, 5).map((h) => (
                      <div key={h.id} className="mb-1 text-xs text-muted-foreground">
                        {formatDateTime(h.checkedAt)} — {HEALTH_STATUS_LABELS[h.status]}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
