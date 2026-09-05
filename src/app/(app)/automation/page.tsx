"use client";

import { useMemo, useState } from "react";
import {
  Bot,
  CheckCircle2,
  Copy,
  Eye,
  History,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Sparkles,
  UserCheck,
  Workflow,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { KpiCard } from "@/components/ui/kpi-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Switch } from "@/components/ui/switch";
import { formatDateTime } from "@/lib/utils";
import { useCRMStore, usePermissions } from "@/store/CRMStoreProvider";
import { automationService } from "@/services";
import {
  AI_CAPABILITIES,
  AUTOMATION_ACTIONS,
  AUTOMATION_TRIGGERS,
  buildWorkflowSummary,
  CONDITION_OPERATORS,
  getActionLabel,
  getConditionFields,
  getTriggerLabel,
  workflowSuccessRate,
} from "@/store/automation";
import type {
  AutomationActionConfig,
  AutomationCondition,
  AutomationWorkflow,
  ConditionOperator,
  WorkflowStatus,
} from "@/types";
import type { ExecutionStatus } from "@/store/types";

type StatusFilter = "all" | WorkflowStatus;
type ExecutionFilter = "all" | ExecutionStatus;

const BUILDER_STEPS = [
  "Basic",
  "Trigger",
  "Conditions",
  "Actions",
  "AI",
  "Approval",
  "Review",
] as const;

const EMPTY_FORM = {
  name: "",
  description: "",
  status: "draft" as WorkflowStatus,
  triggerType: "MANUAL",
  conditionLogic: "all" as "all" | "any",
  conditions: [] as AutomationCondition[],
  actions: [] as AutomationActionConfig[],
  aiEnabled: false,
  aiCapabilities: [] as string[],
  confidenceThreshold: 0.8,
  humanApprovalRequired: false,
  approverRole: "sales_manager",
  approvalTimeoutHours: 24,
  scheduleFrequency: "daily" as "daily" | "weekly" | "monthly",
  scheduleTime: "09:00",
  scheduleTimezone: "Asia/Kolkata",
};

function workflowStatusBadge(status: WorkflowStatus) {
  if (status === "active") return "active";
  if (status === "paused") return "pending";
  if (status === "archived") return "inactive";
  return "draft";
}

function executionStatusBadge(status: ExecutionStatus) {
  if (status === "succeeded") return "active";
  if (status === "failed") return "inactive";
  if (status === "waiting_approval") return "pending";
  if (status === "running" || status === "queued") return "pending";
  return "inactive";
}

function newCondition(triggerType: string): AutomationCondition {
  const fields = getConditionFields(triggerType);
  return {
    id: `cond-${Date.now()}`,
    field: fields[0]?.id ?? "status",
    operator: "equals",
    value: "",
  };
}

function newAction(order: number): AutomationActionConfig {
  return {
    id: `action-${Date.now()}-${order}`,
    actionType: "CREATE_NOTIFICATION",
    parameters: {},
    order,
  };
}

export default function AutomationPage() {
  const {
    canViewAutomation,
    canManageAutomation,
    canExecuteAutomation,
    canApproveAutomation,
    role,
  } = usePermissions();
  const { getWorkflows, getExecutions, getUsers, getTeamAutomationSummary } = useCRMStore();
  const isManager = role === "sales_manager";
  const isSalesperson = role === "salesperson";

  const workflows = getWorkflows();
  const executions = getExecutions();
  const users = getUsers();
  const teamAutomationSummary = isManager ? getTeamAutomationSummary() : null;

  const [tab, setTab] = useState<"workflows" | "executions">(
    isManager && canApproveAutomation
      ? "executions"
      : isSalesperson
        ? "executions"
        : "workflows"
  );
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [executionFilter, setExecutionFilter] = useState<ExecutionFilter>(
    isManager && canApproveAutomation ? "waiting_approval" : "all"
  );
  const [search, setSearch] = useState("");
  const [builderOpen, setBuilderOpen] = useState(false);
  const [builderStep, setBuilderStep] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: "activate" | "pause" | "archive" | "duplicate";
    workflowId: string;
  } | null>(null);
  const [detailWorkflowId, setDetailWorkflowId] = useState<string | null>(null);
  const [detailExecutionId, setDetailExecutionId] = useState<string | null>(null);
  const [executionWorkflowFilter, setExecutionWorkflowFilter] = useState<string>("all");

  const filteredWorkflows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return workflows.filter((workflow) => {
      if (statusFilter !== "all" && workflow.status !== statusFilter) return false;
      if (!q) return true;
      const haystack = [
        workflow.name,
        workflow.description,
        getTriggerLabel(workflow.triggerType),
        ...workflow.actions.map((a) => getActionLabel(a.actionType)),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [workflows, search, statusFilter]);

  const filteredExecutions = useMemo(() => {
    return executions.filter((execution) => {
      if (executionFilter !== "all" && execution.status !== executionFilter) return false;
      if (executionWorkflowFilter !== "all" && execution.workflowId !== executionWorkflowFilter) {
        return false;
      }
      if (!search.trim()) return true;
      const workflow = workflows.find((w) => w.id === execution.workflowId);
      const haystack = [
        execution.id,
        workflow?.name ?? "",
        getTriggerLabel(execution.triggerType),
        execution.resultSummary ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(search.toLowerCase());
    });
  }, [executions, executionFilter, executionWorkflowFilter, search, workflows]);

  const detailWorkflow = workflows.find((w) => w.id === detailWorkflowId);
  const detailExecution = executions.find((e) => e.id === detailExecutionId);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setBuilderStep(0);
    setBuilderOpen(true);
  }

  function openEdit(workflow: AutomationWorkflow) {
    setEditingId(workflow.id);
    setForm({
      name: workflow.name,
      description: workflow.description,
      status: workflow.status,
      triggerType: workflow.triggerType,
      conditionLogic: workflow.conditionLogic,
      conditions: workflow.conditions,
      actions: workflow.actions,
      aiEnabled: workflow.aiEnabled,
      aiCapabilities: workflow.aiConfig?.capabilities ?? [],
      confidenceThreshold: workflow.aiConfig?.confidenceThreshold ?? 0.8,
      humanApprovalRequired: workflow.humanApprovalRequired,
      approverRole: workflow.approvalConfig?.approverRole ?? "sales_manager",
      approvalTimeoutHours: workflow.approvalConfig?.timeoutHours ?? 24,
      scheduleFrequency: workflow.schedule?.frequency ?? "daily",
      scheduleTime: workflow.schedule?.time ?? "09:00",
      scheduleTimezone: workflow.schedule?.timezone ?? "Asia/Kolkata",
    });
    setBuilderStep(0);
    setBuilderOpen(true);
  }

  function buildPayload(status?: WorkflowStatus) {
    return {
      name: form.name,
      description: form.description,
      status: status ?? form.status,
      triggerType: form.triggerType,
      conditionLogic: form.conditionLogic,
      conditions: form.conditions,
      actions: form.actions.map((action, index) => ({ ...action, order: index })),
      aiEnabled: form.aiEnabled,
      aiConfig: {
        enabled: form.aiEnabled,
        capabilities: form.aiCapabilities,
        confidenceThreshold: form.confidenceThreshold,
        requireApprovalBelowThreshold: form.humanApprovalRequired,
      },
      humanApprovalRequired: form.humanApprovalRequired,
      approvalConfig: {
        required: form.humanApprovalRequired,
        approverRole: form.approverRole,
        timeoutHours: form.approvalTimeoutHours,
      },
      schedule:
        form.triggerType === "SCHEDULED"
          ? {
              frequency: form.scheduleFrequency,
              time: form.scheduleTime,
              timezone: form.scheduleTimezone,
            }
          : undefined,
    };
  }

  async function saveDraft() {
    setSaving(true);
    try {
      if (editingId) {
        await automationService.updateWorkflow(editingId, buildPayload("draft"));
        toast.success("Draft saved");
      } else {
        await automationService.createWorkflow(buildPayload("draft"));
        toast.success("Workflow created as draft");
      }
      setBuilderOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save workflow");
    } finally {
      setSaving(false);
    }
  }

  async function saveAndActivate() {
    setSaving(true);
    try {
      const validation = await automationService.validateWorkflow(buildPayload("active"));
      if (!validation.canActivate) {
        toast.error(validation.errors.join(". "));
        return;
      }
      if (editingId) {
        await automationService.updateWorkflow(editingId, buildPayload());
        await automationService.activateWorkflow(editingId);
      } else {
        const created = await automationService.createWorkflow(buildPayload());
        await automationService.activateWorkflow(created.id);
      }
      toast.success("Workflow activated");
      setBuilderOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to activate workflow");
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirmAction() {
    if (!confirmAction) return;
    try {
      const { type, workflowId } = confirmAction;
      if (type === "activate") {
        await automationService.activateWorkflow(workflowId);
        toast.success("Workflow activated");
      } else if (type === "pause") {
        await automationService.pauseWorkflow(workflowId);
        toast.success("Workflow paused");
      } else if (type === "archive") {
        await automationService.archiveWorkflow(workflowId);
        toast.success("Workflow archived");
      } else if (type === "duplicate") {
        await automationService.duplicateWorkflow(workflowId);
        toast.success("Workflow duplicated");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action failed");
    } finally {
      setConfirmAction(null);
    }
  }

  async function handleRetry(executionId: string) {
    try {
      await automationService.retryExecution(executionId);
      toast.success("Retry started — new execution record created");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Retry failed");
    }
  }

  async function handleApprove(executionId: string) {
    try {
      await automationService.approveExecution(executionId);
      toast.success("Execution approved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Approval failed");
    }
  }

  async function handleReject(executionId: string) {
    try {
      await automationService.rejectExecution(executionId, "Rejected from automation UI");
      toast.success("Execution rejected");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Rejection failed");
    }
  }

  const previewWorkflow = useMemo((): AutomationWorkflow => {
    const payload = buildPayload();
    return {
      ...payload,
      id: "preview",
      version: 1,
      createdBy: "preview",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      totalRuns: 0,
      successfulRuns: 0,
      failedRuns: 0,
      conditionLogic: payload.conditionLogic ?? "all",
      conditions: payload.conditions ?? [],
      actions: payload.actions ?? [],
      aiEnabled: payload.aiEnabled ?? false,
      humanApprovalRequired: payload.humanApprovalRequired ?? false,
      priority: "normal",
      triggerType: payload.triggerType ?? "MANUAL",
      name: payload.name ?? "",
      description: payload.description ?? "",
      status: payload.status ?? "draft",
    };
  }, [form]);

  if (!canViewAutomation) {
    return (
      <EmptyState
        icon={Workflow}
        title="Access denied"
        description="You do not have permission to view automation workflows."
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          isManager && canApproveAutomation
            ? "Automation Approvals"
            : isSalesperson
              ? "My Automation"
              : "Automation"
        }
        description={
          isManager && canApproveAutomation
            ? "Review and approve team automation executions. Workflow configuration is read-only for managers."
            : isSalesperson
              ? "View your automation executions and run permitted workflows. Configuration is managed by administrators."
              : "Configure and monitor business automation workflows. Mock execution only — no background engine runs in development."
        }
        actions={
          canManageAutomation ? (
            <Button variant="accent" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Create Workflow
            </Button>
          ) : undefined
        }
      />

      {isManager && teamAutomationSummary ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Pending Approvals" value={String(teamAutomationSummary.pendingApprovals)} featured />
          <KpiCard label="Team Executions" value={String(teamAutomationSummary.totalExecutions)} />
          <KpiCard label="Succeeded" value={String(teamAutomationSummary.succeededCount)} />
          <KpiCard label="Failed" value={String(teamAutomationSummary.failedCount)} />
        </div>
      ) : null}

      <Card className="border-dashed border-warning/40 bg-warning/5">
        <CardContent className="flex flex-col gap-2 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2">
            <Bot className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
            <p>
              Development mode uses mock workflow execution. AI, email, and CRM actions are contracts only — no real workers, schedulers, or LLM calls.
            </p>
          </div>
        </CardContent>
      </Card>

      <Tabs value={tab} onValueChange={(v) => setTab(v as "workflows" | "executions")}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <TabsList>
            <TabsTrigger value="workflows">Workflows</TabsTrigger>
            <TabsTrigger value="executions">Executions</TabsTrigger>
          </TabsList>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              placeholder="Search workflows, triggers, actions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="sm:w-72"
            />
            {tab === "workflows" ? (
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                <SelectTrigger className="sm:w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <>
                <Select
                  value={executionFilter}
                  onValueChange={(v) => setExecutionFilter(v as ExecutionFilter)}
                >
                  <SelectTrigger className="sm:w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="queued">Queued</SelectItem>
                    <SelectItem value="running">Running</SelectItem>
                    <SelectItem value="waiting_approval">Waiting approval</SelectItem>
                    <SelectItem value="succeeded">Succeeded</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={executionWorkflowFilter}
                  onValueChange={setExecutionWorkflowFilter}
                >
                  <SelectTrigger className="sm:w-48">
                    <SelectValue placeholder="All workflows" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All workflows</SelectItem>
                    {workflows.map((workflow) => (
                      <SelectItem key={workflow.id} value={workflow.id}>
                        {workflow.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}
          </div>
        </div>

        <TabsContent value="workflows" className="mt-4">
          {filteredWorkflows.length === 0 ? (
            <EmptyState
              icon={Workflow}
              title="No workflows found"
              description="Create a workflow or adjust your filters."
              actionLabel={canManageAutomation ? "Create Workflow" : undefined}
              onAction={canManageAutomation ? openCreate : undefined}
            />
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden md:table-cell">Trigger</TableHead>
                      <TableHead className="hidden lg:table-cell">Actions</TableHead>
                      <TableHead className="hidden xl:table-cell">AI</TableHead>
                      <TableHead className="hidden xl:table-cell">Approval</TableHead>
                      <TableHead className="hidden lg:table-cell">Success</TableHead>
                      <TableHead className="hidden md:table-cell">Last run</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredWorkflows.map((workflow) => {
                      const rate = workflowSuccessRate(workflow);
                      return (
                        <TableRow key={workflow.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{workflow.name}</p>
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {workflow.description || "No description"}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={workflowStatusBadge(workflow.status)} />
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {getTriggerLabel(workflow.triggerType)}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {workflow.actions.length}
                          </TableCell>
                          <TableCell className="hidden xl:table-cell">
                            {workflow.aiEnabled ? (
                              <Badge variant="ai" className="gap-1">
                                <Sparkles className="h-3 w-3" />
                                AI
                              </Badge>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                          <TableCell className="hidden xl:table-cell">
                            {workflow.humanApprovalRequired ? (
                              <Badge variant="outline" className="gap-1">
                                <UserCheck className="h-3 w-3" />
                                Required
                              </Badge>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {rate !== null ? `${rate}%` : "—"}
                            {workflow.failedRuns > 0 && (
                              <span className="ml-1 text-xs text-destructive">
                                ({workflow.failedRuns} failed)
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                            {workflow.lastRunAt ? formatDateTime(workflow.lastRunAt) : "Never"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex flex-wrap justify-end gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setDetailWorkflowId(workflow.id)}
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                              {canManageAutomation && (
                                <Button size="sm" variant="ghost" onClick={() => openEdit(workflow)}>
                                  Edit
                                </Button>
                              )}
                              {canManageAutomation && workflow.status !== "active" && workflow.status !== "archived" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() =>
                                    setConfirmAction({ type: "activate", workflowId: workflow.id })
                                  }
                                >
                                  <Play className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              {canManageAutomation && workflow.status === "active" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() =>
                                    setConfirmAction({ type: "pause", workflowId: workflow.id })
                                  }
                                >
                                  <Pause className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              {canManageAutomation && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() =>
                                    setConfirmAction({ type: "duplicate", workflowId: workflow.id })
                                  }
                                >
                                  <Copy className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              {canExecuteAutomation && workflow.status === "active" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={async () => {
                                    try {
                                      await automationService.executeWorkflow(workflow.id);
                                      toast.success("Mock execution completed");
                                      setTab("executions");
                                    } catch (error) {
                                      toast.error(
                                        error instanceof Error ? error.message : "Execution failed"
                                      );
                                    }
                                  }}
                                >
                                  <Zap className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              {canManageAutomation && workflow.status !== "archived" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-destructive"
                                  onClick={() =>
                                    setConfirmAction({ type: "archive", workflowId: workflow.id })
                                  }
                                >
                                  Archive
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setExecutionWorkflowFilter(workflow.id);
                                  setTab("executions");
                                }}
                              >
                                <History className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="executions" className="mt-4">
          {filteredExecutions.length === 0 ? (
            <EmptyState
              icon={History}
              title="No executions found"
              description="Run an active workflow to create mock execution history."
            />
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Execution</TableHead>
                      <TableHead>Workflow</TableHead>
                      <TableHead className="hidden md:table-cell">Trigger</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden lg:table-cell">Started</TableHead>
                      <TableHead className="hidden lg:table-cell">Duration</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredExecutions.map((execution) => {
                      const workflow = workflows.find((w) => w.id === execution.workflowId);
                      return (
                        <TableRow key={execution.id}>
                          <TableCell className="font-mono text-xs">{execution.id}</TableCell>
                          <TableCell>{workflow?.name ?? execution.workflowId}</TableCell>
                          <TableCell className="hidden md:table-cell">
                            {getTriggerLabel(execution.triggerType)}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={executionStatusBadge(execution.status)} />
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                            {execution.startedAt ? formatDateTime(execution.startedAt) : "—"}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-xs">
                            {execution.durationMs ? `${execution.durationMs}ms` : "—"}
                            {execution.retryCount > 0 && ` · retry ${execution.retryCount}`}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setDetailExecutionId(execution.id)}
                              >
                                View
                              </Button>
                              {canExecuteAutomation && execution.status === "failed" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleRetry(execution.id)}
                                >
                                  <RefreshCw className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              {canApproveAutomation && execution.status === "waiting_approval" && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleApprove(execution.id)}
                                  >
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-destructive"
                                    onClick={() => handleReject(execution.id)}
                                  >
                                    Reject
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={builderOpen} onOpenChange={setBuilderOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Workflow" : "Create Automation"}</DialogTitle>
            <DialogDescription>
              Step {builderStep + 1} of {BUILDER_STEPS.length}: {BUILDER_STEPS[builderStep]}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-wrap gap-2">
            {BUILDER_STEPS.map((step, index) => (
              <Button
                key={step}
                size="sm"
                variant={builderStep === index ? "default" : "outline"}
                onClick={() => setBuilderStep(index)}
              >
                {index + 1}. {step}
              </Button>
            ))}
          </div>

          {builderStep === 0 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm({ ...form, status: v as WorkflowStatus })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {builderStep === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Trigger</Label>
                <Select
                  value={form.triggerType}
                  onValueChange={(v) => setForm({ ...form, triggerType: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AUTOMATION_TRIGGERS.map((trigger) => (
                      <SelectItem key={trigger.id} value={trigger.id}>
                        [{trigger.category}] {trigger.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {form.triggerType === "SCHEDULED" && (
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Frequency</Label>
                    <Select
                      value={form.scheduleFrequency}
                      onValueChange={(v) =>
                        setForm({
                          ...form,
                          scheduleFrequency: v as "daily" | "weekly" | "monthly",
                        })
                      }
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Time</Label>
                    <Input
                      value={form.scheduleTime}
                      onChange={(e) => setForm({ ...form, scheduleTime: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Timezone</Label>
                    <Input
                      value={form.scheduleTimezone}
                      onChange={(e) => setForm({ ...form, scheduleTimezone: e.target.value })}
                    />
                  </div>
                </div>
              )}
              <Card className="border-dashed">
                <CardContent className="flex items-center gap-3 p-4 text-sm">
                  <Zap className="h-4 w-4 text-warning" />
                  <span>TRIGGER → {getTriggerLabel(form.triggerType)}</span>
                </CardContent>
              </Card>
            </div>
          )}

          {builderStep === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Label>Match</Label>
                <Select
                  value={form.conditionLogic}
                  onValueChange={(v) => setForm({ ...form, conditionLogic: v as "all" | "any" })}
                >
                  <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ALL</SelectItem>
                    <SelectItem value="any">ANY</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setForm({
                      ...form,
                      conditions: [...form.conditions, newCondition(form.triggerType)],
                    })
                  }
                >
                  Add condition
                </Button>
              </div>
              {form.conditions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No conditions — workflow runs on every trigger match.</p>
              ) : (
                form.conditions.map((condition, index) => (
                  <div key={condition.id} className="grid gap-2 rounded-lg border p-3 sm:grid-cols-4">
                    <Select
                      value={condition.field}
                      onValueChange={(v) => {
                        const next = [...form.conditions];
                        next[index] = { ...condition, field: v };
                        setForm({ ...form, conditions: next });
                      }}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {getConditionFields(form.triggerType).map((field) => (
                          <SelectItem key={field.id} value={field.id}>{field.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={condition.operator}
                      onValueChange={(v) => {
                        const next = [...form.conditions];
                        next[index] = { ...condition, operator: v as ConditionOperator };
                        setForm({ ...form, conditions: next });
                      }}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CONDITION_OPERATORS.map((op) => (
                          <SelectItem key={op.id} value={op.id}>{op.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      value={condition.value}
                      onChange={(e) => {
                        const next = [...form.conditions];
                        next[index] = { ...condition, value: e.target.value };
                        setForm({ ...form, conditions: next });
                      }}
                      placeholder="Value"
                    />
                    <Button
                      variant="ghost"
                      className="text-destructive"
                      onClick={() =>
                        setForm({
                          ...form,
                          conditions: form.conditions.filter((c) => c.id !== condition.id),
                        })
                      }
                    >
                      Remove
                    </Button>
                  </div>
                ))
              )}
            </div>
          )}

          {builderStep === 3 && (
            <div className="space-y-4">
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setForm({ ...form, actions: [...form.actions, newAction(form.actions.length)] })
                }
              >
                Add action
              </Button>
              {form.actions.length === 0 ? (
                <p className="text-sm text-muted-foreground">Add at least one action before activating.</p>
              ) : (
                form.actions
                  .slice()
                  .sort((a, b) => a.order - b.order)
                  .map((action, index) => {
                    const def = AUTOMATION_ACTIONS.find((a) => a.id === action.actionType);
                    return (
                      <div key={action.id} className="space-y-2 rounded-lg border p-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline">{index + 1}</Badge>
                          <Select
                            value={action.actionType}
                            onValueChange={(v) => {
                              const next = form.actions.map((a) =>
                                a.id === action.id ? { ...a, actionType: v } : a
                              );
                              setForm({ ...form, actions: next });
                            }}
                          >
                            <SelectTrigger className="min-w-[200px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {AUTOMATION_ACTIONS.map((item) => (
                                <SelectItem key={item.id} value={item.id}>
                                  [{item.category}] {item.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={index === 0}
                            onClick={() => {
                              const sorted = [...form.actions].sort((a, b) => a.order - b.order);
                              const swap = sorted[index - 1];
                              sorted[index - 1] = { ...sorted[index], order: index - 1 };
                              sorted[index] = { ...swap, order: index };
                              setForm({ ...form, actions: sorted });
                            }}
                          >
                            Up
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={index === form.actions.length - 1}
                            onClick={() => {
                              const sorted = [...form.actions].sort((a, b) => a.order - b.order);
                              const swap = sorted[index + 1];
                              sorted[index + 1] = { ...sorted[index], order: index + 1 };
                              sorted[index] = { ...swap, order: index };
                              setForm({ ...form, actions: sorted });
                            }}
                          >
                            Down
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() =>
                              setForm({
                                ...form,
                                actions: form.actions.filter((a) => a.id !== action.id),
                              })
                            }
                          >
                            Remove
                          </Button>
                        </div>
                        {def?.parameters?.map((param) => (
                          <div key={param.key} className="space-y-1">
                            <Label className="text-xs">{param.label}</Label>
                            <Input
                              value={action.parameters[param.key] ?? ""}
                              onChange={(e) => {
                                const next = form.actions.map((a) =>
                                  a.id === action.id
                                    ? {
                                        ...a,
                                        parameters: { ...a.parameters, [param.key]: e.target.value },
                                      }
                                    : a
                                );
                                setForm({ ...form, actions: next });
                              }}
                              placeholder={param.placeholder}
                            />
                          </div>
                        ))}
                      </div>
                    );
                  })
              )}
            </div>
          )}

          {builderStep === 4 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium">Enable AI</p>
                  <p className="text-sm text-muted-foreground">
                    AI runs on the backend in production — never from the browser.
                  </p>
                </div>
                <Switch
                  checked={form.aiEnabled}
                  onCheckedChange={(checked) => setForm({ ...form, aiEnabled: checked })}
                />
              </div>
              {form.aiEnabled && (
                <>
                  <div className="space-y-2">
                    <Label>AI capabilities</Label>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {AI_CAPABILITIES.map((cap) => {
                        const selected = form.aiCapabilities.includes(cap.id);
                        return (
                          <Button
                            key={cap.id}
                            type="button"
                            variant={selected ? "default" : "outline"}
                            className="h-auto justify-start py-2 text-left"
                            onClick={() => {
                              const next = selected
                                ? form.aiCapabilities.filter((id) => id !== cap.id)
                                : [...form.aiCapabilities, cap.id];
                              setForm({ ...form, aiCapabilities: next });
                            }}
                          >
                            <div>
                              <p className="font-medium">{cap.label}</p>
                              <p className="text-xs text-muted-foreground">{cap.description}</p>
                            </div>
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Confidence threshold (0–1)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={1}
                      step={0.05}
                      value={form.confidenceThreshold}
                      onChange={(e) =>
                        setForm({ ...form, confidenceThreshold: Number(e.target.value) })
                      }
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {builderStep === 5 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium">Require human approval</p>
                  <p className="text-sm text-muted-foreground">
                    High-impact actions wait for approver confirmation.
                  </p>
                </div>
                <Switch
                  checked={form.humanApprovalRequired}
                  onCheckedChange={(checked) =>
                    setForm({ ...form, humanApprovalRequired: checked })
                  }
                />
              </div>
              {form.humanApprovalRequired && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Approver role</Label>
                    <Select
                      value={form.approverRole}
                      onValueChange={(v) => setForm({ ...form, approverRole: v })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sales_manager">Sales Manager</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Timeout (hours)</Label>
                    <Input
                      type="number"
                      value={form.approvalTimeoutHours}
                      onChange={(e) =>
                        setForm({ ...form, approvalTimeoutHours: Number(e.target.value) })
                      }
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {builderStep === 6 && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p>{buildWorkflowSummary(previewWorkflow)}</p>
                  <div className="flex flex-wrap gap-2">
                    {form.aiEnabled && <Badge variant="ai">AI enabled</Badge>}
                    {form.humanApprovalRequired && <Badge variant="outline">Approval required</Badge>}
                    <Badge variant="secondary">v{editingId ? "next" : "1"}</Badge>
                  </div>
                </CardContent>
              </Card>
              <div className="space-y-2 rounded-lg border border-dashed p-4 text-sm">
                <div className="flex items-center gap-2 font-medium">
                  <Zap className="h-4 w-4 text-warning" />
                  TRIGGER
                </div>
                <p className="pl-6">{getTriggerLabel(form.triggerType)}</p>
                {form.conditions.length > 0 && (
                  <>
                    <div className="font-medium">CONDITIONS ({form.conditionLogic.toUpperCase()})</div>
                    <ul className="list-disc pl-10">
                      {form.conditions.map((c) => (
                        <li key={c.id}>
                          {c.field} {c.operator} {c.value}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
                <div className="font-medium">ACTIONS</div>
                <ul className="list-disc pl-10">
                  {form.actions
                    .slice()
                    .sort((a, b) => a.order - b.order)
                    .map((a) => (
                      <li key={a.id}>{getActionLabel(a.actionType)}</li>
                    ))}
                </ul>
                {form.humanApprovalRequired && (
                  <div className="flex items-center gap-2 font-medium">
                    <UserCheck className="h-4 w-4" />
                    APPROVAL → {form.approverRole}
                  </div>
                )}
                <div className="flex items-center gap-2 font-medium">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  END
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              disabled={builderStep === 0}
              onClick={() => setBuilderStep((s) => Math.max(0, s - 1))}
            >
              Back
            </Button>
            {builderStep < BUILDER_STEPS.length - 1 ? (
              <Button type="button" onClick={() => setBuilderStep((s) => s + 1)}>
                Next
              </Button>
            ) : (
              <>
                {canManageAutomation && (
                  <SubmitButton type="button" variant="outline" loading={saving} onClick={saveDraft}>
                    Save Draft
                  </SubmitButton>
                )}
                {canManageAutomation && (
                  <SubmitButton type="button" variant="accent" loading={saving} onClick={saveAndActivate}>
                    Activate
                  </SubmitButton>
                )}
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!detailWorkflow} onOpenChange={() => setDetailWorkflowId(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          {detailWorkflow && (
            <>
              <DialogHeader>
                <DialogTitle>{detailWorkflow.name}</DialogTitle>
                <DialogDescription>{detailWorkflow.description}</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <div className="flex flex-wrap gap-2">
                  <StatusBadge status={workflowStatusBadge(detailWorkflow.status)} />
                  {detailWorkflow.aiEnabled && <Badge variant="ai">AI</Badge>}
                  {detailWorkflow.humanApprovalRequired && <Badge variant="outline">Approval</Badge>}
                  <Badge variant="secondary">v{detailWorkflow.version}</Badge>
                </div>
                <p>{buildWorkflowSummary(detailWorkflow)}</p>
                <p className="text-muted-foreground">
                  Created by {users.find((u) => u.id === detailWorkflow.createdBy)?.name ?? detailWorkflow.createdBy}
                  · Updated {formatDateTime(detailWorkflow.updatedAt)}
                </p>
                <div className="rounded-lg border border-dashed p-3 space-y-2">
                  <p className="font-medium">Flow</p>
                  <p>↓ {getTriggerLabel(detailWorkflow.triggerType)}</p>
                  {detailWorkflow.conditions.length > 0 && <p>↓ Conditions ({detailWorkflow.conditionLogic})</p>}
                  {detailWorkflow.actions
                    .slice()
                    .sort((a, b) => a.order - b.order)
                    .map((a) => (
                      <p key={a.id}>↓ {getActionLabel(a.actionType)}</p>
                    ))}
                  {detailWorkflow.humanApprovalRequired && <p>↓ Approval</p>}
                  <p>↓ End</p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!detailExecution} onOpenChange={() => setDetailExecutionId(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          {detailExecution && (
            <>
              <DialogHeader>
                <DialogTitle>Execution {detailExecution.id}</DialogTitle>
                <DialogDescription>
                  Workflow v{detailExecution.workflowVersion} · {detailExecution.status}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <StatusBadge status={executionStatusBadge(detailExecution.status)} />
                {detailExecution.errorMessage && (
                  <p className="text-destructive">{detailExecution.errorMessage}</p>
                )}
                {detailExecution.resultSummary && <p>{detailExecution.resultSummary}</p>}
                {Boolean(detailExecution.metadata?.aiEnabled) && (
                  <Badge variant="ai">AI workflow (backend contract)</Badge>
                )}
                <div className="space-y-2">
                  {detailExecution.steps.map((step) => (
                    <div key={step.id} className="rounded-lg border p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium">{step.name}</p>
                        <StatusBadge status={executionStatusBadge(step.status as ExecutionStatus)} />
                      </div>
                      {step.message && (
                        <p className="mt-1 text-xs text-muted-foreground">{step.message}</p>
                      )}
                    </div>
                  ))}
                </div>
                {canApproveAutomation && detailExecution.status === "waiting_approval" && (
                  <div className="flex gap-2">
                    <Button onClick={() => handleApprove(detailExecution.id)}>Approve</Button>
                    <Button variant="destructive" onClick={() => handleReject(detailExecution.id)}>
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!confirmAction}
        onOpenChange={() => setConfirmAction(null)}
        title={
          confirmAction?.type === "activate"
            ? "Activate workflow?"
            : confirmAction?.type === "pause"
              ? "Pause workflow?"
              : confirmAction?.type === "archive"
                ? "Archive workflow?"
                : "Duplicate workflow?"
        }
        description={
          confirmAction?.type === "archive"
            ? "Archived workflows are hidden from active use. Execution history is preserved."
            : "Confirm this automation workflow action."
        }
        confirmLabel={
          confirmAction?.type === "archive"
            ? "Archive"
            : confirmAction?.type === "activate"
              ? "Activate"
              : "Confirm"
        }
        variant={confirmAction?.type === "archive" ? "destructive" : "default"}
        onConfirm={handleConfirmAction}
      />
    </div>
  );
}
