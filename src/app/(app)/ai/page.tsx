"use client";

import { useMemo, useState } from "react";
import {
  Bot,
  RefreshCw,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { KpiCard } from "@/components/ui/kpi-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDateTime } from "@/lib/utils";
import { useCRMStore, usePermissions } from "@/store/CRMStoreProvider";
import { aiService } from "@/services";
import {
  AI_CAPABILITY_CATEGORIES,
  AI_MODEL_REGISTRY,
  AI_PROVIDERS,
  type AIApprovalPolicy,
  type AIExecutionStatus,
  type AIUsagePeriod,
  getCapabilityLabel,
} from "@/store/ai";

function executionStatusBadge(status: AIExecutionStatus) {
  if (status === "succeeded") return "active";
  if (status === "failed") return "inactive";
  if (status === "waiting_approval") return "pending";
  if (status === "running" || status === "queued") return "pending";
  return "inactive";
}

function providerStatusLabel(status: string) {
  if (status === "configured") return "Configured on backend";
  if (status === "error") return "Error";
  if (status === "disabled") return "Disabled";
  return "Backend connection required";
}

export default function AIPage() {
  const { canViewAI, canManageAI, canExecuteAI, canApproveAI } = usePermissions();
  const {
    getAIConfiguration,
    getAICapabilities,
    getAIExecutions,
    getAIUsage,
    getAIStatus,
    getAIModels,
  } = useCRMStore();

  const config = getAIConfiguration();
  const capabilities = getAICapabilities();
  const executions = getAIExecutions();
  const status = getAIStatus();
  const models = getAIModels();

  const [tab, setTab] = useState("overview");
  const [usagePeriod, setUsagePeriod] = useState<AIUsagePeriod>("30d");
  const [executionFilter, setExecutionFilter] = useState<AIExecutionStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [configureDraft, setConfigureDraft] = useState<(typeof capabilities)[number] | null>(null);
  const [runCapabilityId, setRunCapabilityId] = useState<string | null>(null);

  const usage = getAIUsage({ period: usagePeriod });

  const filteredExecutions = useMemo(() => {
    return executions.filter((execution) => {
      if (executionFilter !== "all" && execution.status !== executionFilter) return false;
      if (!search.trim()) return true;
      const haystack = [
        execution.id,
        execution.capability,
        execution.sourceType,
        execution.sourceId,
        execution.resultSummary ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(search.toLowerCase());
    });
  }, [executions, executionFilter, search]);

  const detailExecution = executions.find((e) => e.id === detailId);

  const groupedCapabilities = useMemo(() => {
    return AI_CAPABILITY_CATEGORIES.map((category) => ({
      category,
      items: capabilities.filter((c) => c.category === category),
    })).filter((group) => group.items.length > 0);
  }, [capabilities]);

  async function saveConfiguration(patch: Partial<typeof config>) {
    setSaving(true);
    try {
      await aiService.updateConfiguration(patch);
      toast.success("AI configuration saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save configuration");
    } finally {
      setSaving(false);
    }
  }

  async function saveCapability() {
    if (!configureDraft) return;
    setSaving(true);
    try {
      await aiService.updateCapability(configureDraft.id, configureDraft);
      toast.success("Capability updated");
      setConfigureDraft(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update capability");
    } finally {
      setSaving(false);
    }
  }

  async function handleRunCapability(capabilityId: string) {
    setSaving(true);
    try {
      await aiService.runCapability({
        capabilityId,
        sourceType: "system",
        sourceId: "qa-run",
      });
      toast.success("Mock AI execution completed");
      setTab("executions");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Execution failed");
    } finally {
      setSaving(false);
      setRunCapabilityId(null);
    }
  }

  async function handleRetry(id: string) {
    try {
      await aiService.retryExecution(id);
      toast.success("Retry created a new execution record");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Retry failed");
    }
  }

  async function handleApprove(id: string) {
    try {
      await aiService.approveExecution(id);
      toast.success("AI result approved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Approval failed");
    }
  }

  async function handleReject(id: string) {
    try {
      await aiService.rejectExecution(id, "Rejected from AI management UI");
      toast.success("AI result rejected");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Rejection failed");
    }
  }

  if (!canViewAI || !canManageAI) {
    return (
      <EmptyState
        icon={Shield}
        title="Access restricted"
        description="Organization AI configuration is available to administrators only."
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Configuration & Usage"
        description="Manage AI capabilities, policies, usage, and future provider configuration."
      />

      <Card className="border-dashed border-warning/40 bg-warning/5">
        <CardContent className="flex items-start gap-3 p-4 text-sm">
          <Bot className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <p>
            AI provider calls are currently <strong>backend-contract / mock only</strong>. No real
            LLM requests are made from the browser. Estimated costs are illustrative — not
            authoritative billing.
          </p>
        </CardContent>
      </Card>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex h-auto flex-wrap gap-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="capabilities">Capabilities</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="executions">Executions</TabsTrigger>
          <TabsTrigger value="policies">Policies</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <KpiCard
              label="AI Status"
              value={config.enabled ? "Enabled" : "Disabled"}
              subValue={providerStatusLabel(config.providerStatus)}
            />
            <KpiCard
              label="Enabled Capabilities"
              value={`${status.enabledCapabilities}/${status.totalCapabilities}`}
              subValue="Mock registry"
            />
            <KpiCard
              label="AI Executions"
              value={String(usage.totalExecutions)}
              subValue={`${usagePeriod} (mock)`}
            />
            <KpiCard
              label="Success Rate"
              value={usage.successRate !== null ? `${usage.successRate}%` : "—"}
              subValue="Mock executions"
            />
            <KpiCard
              label="Tokens Used"
              value={usage.totalTokens.toLocaleString()}
              subValue="Estimated mock usage"
            />
            <KpiCard
              label="Estimated Cost"
              value={`$${usage.estimatedCost.toFixed(4)}`}
              subValue="Not provider billing"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Latest failures</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {executions.filter((e) => e.status === "failed").slice(0, 3).map((execution) => (
                <div key={execution.id} className="rounded-lg border p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">
                      {getCapabilityLabel(execution.capability, capabilities)}
                    </p>
                    <StatusBadge status={executionStatusBadge(execution.status)} />
                  </div>
                  <p className="mt-1 text-muted-foreground">{execution.errorMessage}</p>
                </div>
              ))}
              {executions.filter((e) => e.status === "failed").length === 0 && (
                <p className="text-sm text-muted-foreground">No failed executions in mock history.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="configuration" className="mt-4 space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Provider</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {AI_PROVIDERS.map((provider) => (
                  <div key={provider.id} className="rounded-lg border p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium">{provider.label}</p>
                      <Badge variant="outline">{providerStatusLabel(config.providerStatus)}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{provider.description}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Credentials: configured on backend (not stored in browser)
                    </p>
                  </div>
                ))}
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="font-medium">Enable AI</p>
                    <p className="text-sm text-muted-foreground">Organization-wide AI policy switch</p>
                  </div>
                  <Switch
                    checked={config.enabled}
                    disabled={!canManageAI}
                    onCheckedChange={(checked) => saveConfiguration({ enabled: checked })}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Models</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Default model</Label>
                  <Select
                    value={config.defaultModel}
                    onValueChange={(value) => saveConfiguration({ defaultModel: value })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {models.filter((m) => m.status === "active").map((model) => (
                        <SelectItem key={model.id} value={model.id}>{model.displayName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Fallback model</Label>
                  <Select
                    value={config.fallbackModel}
                    onValueChange={(value) => saveConfiguration({ fallbackModel: value })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {models.filter((m) => m.status === "active").map((model) => (
                        <SelectItem key={model.id} value={model.id}>{model.displayName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Temperature</Label>
                    <Input
                      type="number"
                      min={0}
                      max={1}
                      step={0.1}
                      value={config.temperature}
                      onChange={(e) => saveConfiguration({ temperature: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Max tokens</Label>
                    <Input
                      type="number"
                      value={config.maxTokens}
                      onChange={(e) => saveConfiguration({ maxTokens: Number(e.target.value) })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Model registry</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Model</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Input / 1k</TableHead>
                    <TableHead>Output / 1k</TableHead>
                    <TableHead>Default</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {AI_MODEL_REGISTRY.map((model) => (
                    <TableRow key={model.id}>
                      <TableCell>{model.displayName}</TableCell>
                      <TableCell className="capitalize">{model.provider}</TableCell>
                      <TableCell><StatusBadge status={model.status === "active" ? "active" : "inactive"} /></TableCell>
                      <TableCell>${model.inputCostPer1kTokens}</TableCell>
                      <TableCell>${model.outputCostPer1kTokens}</TableCell>
                      <TableCell>
                        {model.id === config.defaultModel ? <Badge>Default</Badge> : model.id === config.fallbackModel ? <Badge variant="outline">Fallback</Badge> : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="capabilities" className="mt-4 space-y-4">
          {groupedCapabilities.map((group) => (
            <Card key={group.category}>
              <CardHeader>
                <CardTitle className="text-base">{group.category}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {group.items.map((capability) => (
                  <div key={capability.id} className="rounded-lg border p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">{capability.name}</p>
                          <Badge variant="outline">{capability.id}</Badge>
                          {capability.enabled ? <Badge variant="ai">Enabled</Badge> : <Badge variant="secondary">Disabled</Badge>}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{capability.description}</p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          Model: {capability.modelId} · Threshold: {capability.confidenceThreshold} · Approval: {capability.approvalPolicy}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {canManageAI && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setConfigureDraft({ ...capability })}
                          >
                            Configure
                          </Button>
                        )}
                        {canExecuteAI && capability.enabled && (
                          <Button size="sm" variant="ai" onClick={() => setRunCapabilityId(capability.id)}>
                            Run mock
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="usage" className="mt-4 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Select value={usagePeriod} onValueChange={(v) => setUsagePeriod(v as AIUsagePeriod)}>
              <SelectTrigger className="sm:w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">Mock usage data — not provider billing</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <KpiCard label="Executions" value={String(usage.totalExecutions)} />
            <KpiCard label="Failed" value={String(usage.failedExecutions)} />
            <KpiCard label="Avg latency" value={`${usage.averageLatencyMs}ms`} />
            <KpiCard label="Est. cost" value={`$${usage.estimatedCost.toFixed(4)}`} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-base">By capability</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                {usage.byCapability.map((row) => (
                  <div key={row.capability} className="flex justify-between gap-2 border-b pb-2">
                    <span>{getCapabilityLabel(row.capability, capabilities)}</span>
                    <span className="text-muted-foreground">{row.count} · ${row.cost.toFixed(4)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">By model</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                {usage.byModel.map((row) => (
                  <div key={row.model} className="flex justify-between gap-2 border-b pb-2">
                    <span>{row.model}</span>
                    <span className="text-muted-foreground">{row.count} · {row.tokens} tokens</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="executions" className="mt-4 space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              placeholder="Search capability, source, execution ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="sm:max-w-sm"
            />
            <Select value={executionFilter} onValueChange={(v) => setExecutionFilter(v as AIExecutionStatus | "all")}>
              <SelectTrigger className="sm:w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="succeeded">Succeeded</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="waiting_approval">Waiting approval</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardContent className="overflow-x-auto p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Capability</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Confidence</TableHead>
                    <TableHead className="hidden lg:table-cell">Tokens</TableHead>
                    <TableHead className="hidden lg:table-cell">Est. cost</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExecutions.map((execution) => (
                    <TableRow key={execution.id}>
                      <TableCell className="text-xs">{formatDateTime(execution.requestedAt)}</TableCell>
                      <TableCell>{getCapabilityLabel(execution.capability, capabilities)}</TableCell>
                      <TableCell>{execution.model}</TableCell>
                      <TableCell><StatusBadge status={executionStatusBadge(execution.status)} /></TableCell>
                      <TableCell className="hidden md:table-cell">
                        {execution.confidence !== undefined ? `${Math.round(execution.confidence * 100)}%` : "—"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">{execution.totalTokens}</TableCell>
                      <TableCell className="hidden lg:table-cell">${execution.estimatedCost.toFixed(4)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => setDetailId(execution.id)}>View</Button>
                          {canExecuteAI && execution.status === "failed" && (
                            <Button size="sm" variant="ghost" onClick={() => handleRetry(execution.id)}>
                              <RefreshCw className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {canApproveAI && execution.status === "waiting_approval" && (
                            <>
                              <Button size="sm" variant="ghost" onClick={() => handleApprove(execution.id)}>Approve</Button>
                              <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleReject(execution.id)}>Reject</Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="policies" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Confidence & approval</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Default confidence threshold</Label>
                <Input
                  type="number"
                  min={0}
                  max={1}
                  step={0.05}
                  value={config.defaultConfidenceThreshold}
                  onChange={(e) => saveConfiguration({ defaultConfidenceThreshold: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Approval policy</Label>
                <Select
                  value={config.approvalPolicy}
                  onValueChange={(value) => saveConfiguration({ approvalPolicy: value as AIApprovalPolicy })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="always">Always require approval</SelectItem>
                    <SelectItem value="below_threshold">Below confidence threshold</SelectItem>
                    <SelectItem value="never">Never require approval</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium">Require approval below threshold</p>
                  <p className="text-sm text-muted-foreground">High-impact AI outputs wait for human review</p>
                </div>
                <Switch
                  checked={config.requireApprovalBelowThreshold}
                  onCheckedChange={(checked) => saveConfiguration({ requireApprovalBelowThreshold: checked })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Privacy & data processing</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {[
                ["allowEmailAI", "Allow email content processing"],
                ["allowPOAI", "Allow PO document processing"],
                ["allowDealAI", "Allow deal data processing"],
                ["allowCustomerAI", "Allow customer data processing"],
                ["allowAutomationAI", "Allow automation AI actions"],
                ["redactSensitiveData", "Redact sensitive data before AI processing"],
                ["allowProviderRetention", "Allow provider retention (backend policy only)"],
              ].map(([key, label]) => (
                <div key={key} className="flex items-center justify-between rounded-lg border p-3">
                  <p className="text-sm">{label}</p>
                  <Switch
                    checked={Boolean(config[key as keyof typeof config])}
                    onCheckedChange={(checked) => saveConfiguration({ [key]: checked } as Partial<typeof config>)}
                  />
                </div>
              ))}
              <p className="text-xs text-muted-foreground">
                Policy configuration only. Provider retention/training behavior must be verified and enforced by the backend.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!detailExecution} onOpenChange={() => setDetailId(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          {detailExecution && (
            <>
              <DialogHeader>
                <DialogTitle>AI Execution {detailExecution.id}</DialogTitle>
                <DialogDescription>{getCapabilityLabel(detailExecution.capability, capabilities)}</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <StatusBadge status={executionStatusBadge(detailExecution.status)} />
                <p><span className="text-muted-foreground">Provider:</span> {detailExecution.provider}</p>
                <p><span className="text-muted-foreground">Model:</span> {detailExecution.model}</p>
                <p><span className="text-muted-foreground">Source:</span> {detailExecution.sourceType} / {detailExecution.sourceId}</p>
                {detailExecution.confidence !== undefined && (
                  <p><span className="text-muted-foreground">Confidence:</span> {Math.round(detailExecution.confidence * 100)}%</p>
                )}
                <p><span className="text-muted-foreground">Tokens:</span> {detailExecution.totalTokens} (in {detailExecution.inputTokens} / out {detailExecution.outputTokens})</p>
                <p><span className="text-muted-foreground">Estimated cost:</span> ${detailExecution.estimatedCost.toFixed(4)} {detailExecution.currency}</p>
                {detailExecution.automationExecutionId && (
                  <p><span className="text-muted-foreground">Automation execution:</span> {detailExecution.automationExecutionId}</p>
                )}
                {detailExecution.resultSummary && <p>{detailExecution.resultSummary}</p>}
                {detailExecution.errorMessage && <p className="text-destructive">{detailExecution.errorMessage}</p>}
                <Badge variant="ai">Mock AI result</Badge>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!configureDraft} onOpenChange={() => setConfigureDraft(null)}>
        <DialogContent>
          {configureDraft && (
            <>
              <DialogHeader>
                <DialogTitle>{configureDraft.name}</DialogTitle>
                <DialogDescription>{configureDraft.description}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Enabled</Label>
                  <Switch
                    checked={configureDraft.enabled}
                    onCheckedChange={(checked) =>
                      setConfigureDraft({ ...configureDraft, enabled: checked })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Model</Label>
                  <Select
                    value={configureDraft.modelId}
                    onValueChange={(value) => setConfigureDraft({ ...configureDraft, modelId: value })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {models.map((model) => (
                        <SelectItem key={model.id} value={model.id}>{model.displayName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Confidence threshold</Label>
                  <Input
                    type="number"
                    min={0}
                    max={1}
                    step={0.05}
                    value={configureDraft.confidenceThreshold}
                    onChange={(e) =>
                      setConfigureDraft({
                        ...configureDraft,
                        confidenceThreshold: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Approval policy</Label>
                  <Select
                    value={configureDraft.approvalPolicy}
                    onValueChange={(value) =>
                      setConfigureDraft({
                        ...configureDraft,
                        approvalPolicy: value as AIApprovalPolicy,
                      })
                    }
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="always">Always</SelectItem>
                      <SelectItem value="below_threshold">Below threshold</SelectItem>
                      <SelectItem value="never">Never</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <SubmitButton loading={saving} onClick={saveCapability}>Save</SubmitButton>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!runCapabilityId}
        onOpenChange={() => setRunCapabilityId(null)}
        title="Run mock AI capability?"
        description="This creates a mock AIExecutionRecord. No real provider call is made."
        confirmLabel="Run mock"
        onConfirm={() => runCapabilityId && handleRunCapability(runCapabilityId)}
      />
    </div>
  );
}
