import type { AutomationStep, AutomationWorkflow } from "@/types";
import type { AutomationExecutionRecord } from "./types";
import { generateId } from "./storage";

export type WorkflowStatus = "draft" | "active" | "paused" | "archived";
export type ConditionLogic = "all" | "any";
export type WorkflowPriority = "low" | "normal" | "high";

export type ConditionOperator =
  | "equals"
  | "not_equals"
  | "contains"
  | "not_contains"
  | "greater_than"
  | "less_than"
  | "greater_or_equal"
  | "less_or_equal"
  | "is_empty"
  | "is_not_empty"
  | "in"
  | "not_in";

export type ExecutionStatus =
  | "queued"
  | "running"
  | "waiting_approval"
  | "succeeded"
  | "failed"
  | "cancelled";

export type ExecutionStepStatus =
  | "pending"
  | "running"
  | "waiting_approval"
  | "succeeded"
  | "failed"
  | "skipped";

export interface AutomationCondition {
  id: string;
  field: string;
  operator: ConditionOperator;
  value: string;
}

export interface AutomationActionConfig {
  id: string;
  actionType: string;
  parameters: Record<string, string>;
  order: number;
}

export interface AutomationScheduleConfig {
  frequency: "daily" | "weekly" | "monthly";
  time: string;
  timezone: string;
  dayOfWeek?: number;
  dayOfMonth?: number;
}

export interface AutomationAiConfig {
  enabled: boolean;
  capabilities: string[];
  confidenceThreshold?: number;
  requireApprovalBelowThreshold?: boolean;
}

export interface AutomationApprovalConfig {
  required: boolean;
  approverRole?: string;
  timeoutHours?: number;
}

export interface AutomationExecutionStep {
  id: string;
  name: string;
  type: "trigger" | "condition" | "action" | "approval" | "result";
  status: ExecutionStepStatus;
  startedAt?: string;
  completedAt?: string;
  message?: string;
  metadata?: Record<string, unknown>;
}

export interface TriggerDefinition {
  id: string;
  label: string;
  category: string;
  description?: string;
}

export interface ActionDefinition {
  id: string;
  label: string;
  category: string;
  description?: string;
  aiAction?: boolean;
  parameters?: { key: string; label: string; placeholder?: string }[];
}

export interface AiCapabilityDefinition {
  id: string;
  label: string;
  description?: string;
}

export const CONDITION_OPERATORS: { id: ConditionOperator; label: string }[] = [
  { id: "equals", label: "Equals" },
  { id: "not_equals", label: "Not equals" },
  { id: "contains", label: "Contains" },
  { id: "not_contains", label: "Does not contain" },
  { id: "greater_than", label: "Greater than" },
  { id: "less_than", label: "Less than" },
  { id: "greater_or_equal", label: "Greater or equal" },
  { id: "less_or_equal", label: "Less or equal" },
  { id: "is_empty", label: "Is empty" },
  { id: "is_not_empty", label: "Is not empty" },
  { id: "in", label: "In list" },
  { id: "not_in", label: "Not in list" },
];

export const AUTOMATION_TRIGGERS: TriggerDefinition[] = [
  { id: "DEAL_CREATED", label: "Deal created", category: "CRM" },
  { id: "DEAL_UPDATED", label: "Deal updated", category: "CRM" },
  { id: "DEAL_STAGE_CHANGED", label: "Deal stage changed", category: "CRM" },
  { id: "DEAL_WON", label: "Deal won", category: "CRM" },
  { id: "DEAL_LOST", label: "Deal lost", category: "CRM" },
  { id: "CUSTOMER_CREATED", label: "Customer created", category: "Customer" },
  { id: "CUSTOMER_UPDATED", label: "Customer updated", category: "Customer" },
  { id: "CONTACT_CREATED", label: "Contact created", category: "Contact" },
  { id: "CONTACT_UPDATED", label: "Contact updated", category: "Contact" },
  { id: "EMAIL_RECEIVED", label: "Email received", category: "Email" },
  { id: "EMAIL_SENT", label: "Email sent", category: "Email" },
  { id: "EMAIL_REPLIED", label: "Email replied", category: "Email" },
  { id: "EMAIL_CLASSIFIED", label: "Email classified", category: "Email" },
  { id: "EMAIL_LINKED_TO_DEAL", label: "Email linked to deal", category: "Email" },
  { id: "EMAIL_REQUIRES_FOLLOWUP", label: "Email requires follow-up", category: "Email" },
  { id: "PO_RECEIVED", label: "PO received", category: "Purchase Order" },
  { id: "PO_CREATED", label: "PO created", category: "Purchase Order" },
  { id: "PO_APPROVED", label: "PO approved", category: "Purchase Order" },
  { id: "PO_REJECTED", label: "PO rejected", category: "Purchase Order" },
  { id: "PO_REQUIRES_REVIEW", label: "PO requires review", category: "Purchase Order" },
  { id: "FOLLOWUP_CREATED", label: "Follow-up created", category: "Follow-up" },
  { id: "FOLLOWUP_DUE", label: "Follow-up due", category: "Follow-up" },
  { id: "FOLLOWUP_OVERDUE", label: "Follow-up overdue", category: "Follow-up" },
  { id: "FOLLOWUP_COMPLETED", label: "Follow-up completed", category: "Follow-up" },
  { id: "TARGET_CREATED", label: "Target created", category: "Target" },
  { id: "TARGET_UPDATED", label: "Target updated", category: "Target" },
  { id: "TARGET_MISSED", label: "Target missed", category: "Target" },
  { id: "USER_CREATED", label: "User created", category: "User / Team" },
  { id: "USER_DEACTIVATED", label: "User deactivated", category: "User / Team" },
  { id: "TEAM_REQUEST_CREATED", label: "Team request created", category: "User / Team" },
  { id: "TEAM_REQUEST_APPROVED", label: "Team request approved", category: "User / Team" },
  { id: "TEAM_REQUEST_REJECTED", label: "Team request rejected", category: "User / Team" },
  { id: "SCHEDULED", label: "Scheduled", category: "System" },
  { id: "MANUAL", label: "Manual run", category: "System" },
];

export const AUTOMATION_ACTIONS: ActionDefinition[] = [
  { id: "CREATE_DEAL", label: "Create deal", category: "CRM", parameters: [{ key: "stage", label: "Initial stage" }] },
  { id: "UPDATE_DEAL", label: "Update deal", category: "CRM" },
  { id: "UPDATE_DEAL_STAGE", label: "Update deal stage", category: "CRM", parameters: [{ key: "stage", label: "Stage" }] },
  { id: "CREATE_ACTIVITY", label: "Create activity", category: "CRM", parameters: [{ key: "title", label: "Title" }] },
  { id: "CREATE_FOLLOWUP", label: "Create follow-up", category: "CRM", parameters: [{ key: "dueInDays", label: "Due in days" }] },
  { id: "SEND_EMAIL", label: "Send email", category: "Email" },
  { id: "SEND_TEMPLATE_EMAIL", label: "Send template email", category: "Email", parameters: [{ key: "templateId", label: "Template" }] },
  { id: "CLASSIFY_EMAIL", label: "Classify email", category: "Email" },
  { id: "GENERATE_EMAIL_REPLY", label: "Generate email reply", category: "Email", aiAction: true },
  { id: "CREATE_NOTIFICATION", label: "Create notification", category: "Notifications" },
  { id: "NOTIFY_SALESPERSON", label: "Notify salesperson", category: "Notifications" },
  { id: "NOTIFY_MANAGER", label: "Notify manager", category: "Notifications" },
  { id: "NOTIFY_ADMIN", label: "Notify admin", category: "Notifications" },
  { id: "CREATE_PO_REVIEW_TASK", label: "Create PO review task", category: "Purchase Orders" },
  { id: "UPDATE_PO_STATUS", label: "Update PO status", category: "Purchase Orders", parameters: [{ key: "status", label: "Status" }] },
  { id: "CREATE_TASK", label: "Create task", category: "Tasks" },
  { id: "COMPLETE_TASK", label: "Complete task", category: "Tasks" },
  { id: "AI_CLASSIFY", label: "AI classify", category: "AI", aiAction: true },
  { id: "AI_SUMMARIZE", label: "AI summarize", category: "AI", aiAction: true },
  { id: "AI_GENERATE_REPLY", label: "AI generate reply", category: "AI", aiAction: true },
  { id: "AI_EXTRACT_DATA", label: "AI extract data", category: "AI", aiAction: true },
  { id: "AI_SCORE_LEAD", label: "AI score lead", category: "AI", aiAction: true },
  { id: "WAIT", label: "Wait", category: "Control", parameters: [{ key: "durationMinutes", label: "Minutes" }] },
  { id: "REQUIRE_APPROVAL", label: "Require approval", category: "Control" },
];

export const AI_CAPABILITIES: AiCapabilityDefinition[] = [
  { id: "classify_email", label: "Classify email", description: "Detect intent and category" },
  { id: "summarize_email", label: "Summarize email", description: "Generate concise summary" },
  { id: "extract_po_data", label: "Extract PO data", description: "Structured PO field extraction" },
  { id: "generate_reply", label: "Generate reply", description: "Suggested email response" },
  { id: "score_lead", label: "Score lead", description: "Lead quality scoring" },
  { id: "predict_followup", label: "Predict follow-up priority", description: "Prioritize follow-ups" },
  { id: "sales_intent", label: "Identify sales intent", description: "Detect buying signals" },
];

export const CONDITION_FIELDS: Record<string, { id: string; label: string }[]> = {
  DEAL_STAGE_CHANGED: [
    { id: "stage", label: "Stage" },
    { id: "dealValue", label: "Deal value" },
    { id: "ownerId", label: "Owner" },
    { id: "daysSinceActivity", label: "Days since activity" },
  ],
  EMAIL_RECEIVED: [
    { id: "intent", label: "Intent" },
    { id: "fromDomain", label: "Sender domain" },
    { id: "subject", label: "Subject" },
  ],
  PO_RECEIVED: [
    { id: "confidence", label: "AI confidence" },
    { id: "amount", label: "PO amount" },
    { id: "status", label: "Status" },
  ],
  FOLLOWUP_OVERDUE: [
    { id: "daysOverdue", label: "Days overdue" },
    { id: "priority", label: "Priority" },
  ],
  default: [
    { id: "status", label: "Status" },
    { id: "value", label: "Value" },
    { id: "ownerId", label: "Owner" },
  ],
};

const LEGACY_TRIGGER_MAP: Record<string, string> = {
  "customer sends email": "EMAIL_RECEIVED",
  "po document uploaded": "PO_RECEIVED",
  "no activity for 5 days": "FOLLOWUP_OVERDUE",
  "customer email received": "EMAIL_RECEIVED",
};

const LEGACY_ACTION_MAP: Record<string, string> = {
  "classify email": "CLASSIFY_EMAIL",
  "link to crm customer": "CREATE_ACTIVITY",
  "link to customer": "CREATE_ACTIVITY",
  "update deal": "UPDATE_DEAL",
  "create activity": "CREATE_ACTIVITY",
  "create follow-up if required": "CREATE_FOLLOWUP",
  "ai extract po fields": "AI_EXTRACT_DATA",
  "link to deal": "UPDATE_DEAL",
  "notify owner": "NOTIFY_SALESPERSON",
  "generate ai insight": "AI_SUMMARIZE",
  "notify sales manager": "NOTIFY_MANAGER",
};

function inferTriggerFromLegacy(steps: AutomationStep[]): string {
  const trigger = steps.find((s) => s.type === "trigger");
  if (!trigger) return "MANUAL";
  const key = trigger.label.toLowerCase();
  return LEGACY_TRIGGER_MAP[key] ?? "MANUAL";
}

function legacyStepsToActions(steps: AutomationStep[]): AutomationActionConfig[] {
  return steps
    .filter((s) => s.type === "action")
    .map((step, index) => {
      const actionType = LEGACY_ACTION_MAP[step.label.toLowerCase()] ?? "CREATE_NOTIFICATION";
      return {
        id: step.id || generateId("action"),
        actionType,
        parameters: {},
        order: index,
      };
    });
}

export function getTriggerLabel(triggerType: string): string {
  return AUTOMATION_TRIGGERS.find((t) => t.id === triggerType)?.label ?? triggerType;
}

export function getActionLabel(actionType: string): string {
  return AUTOMATION_ACTIONS.find((a) => a.id === actionType)?.label ?? actionType;
}

export function getConditionFields(triggerType: string) {
  return CONDITION_FIELDS[triggerType] ?? CONDITION_FIELDS.default;
}

export function isWorkflowActive(workflow: AutomationWorkflow): boolean {
  return workflow.status === "active";
}

export function workflowSuccessRate(workflow: AutomationWorkflow): number | null {
  if (workflow.totalRuns === 0) return null;
  return Math.round((workflow.successfulRuns / workflow.totalRuns) * 100);
}

export function normalizeWorkflow(input: Partial<AutomationWorkflow> & { id: string; name: string }): AutomationWorkflow {
  const now = new Date().toISOString();
  const legacySteps = input.steps ?? [];
  const hasLegacy = legacySteps.length > 0 && (!input.triggerType || !input.actions?.length);

  const triggerType = input.triggerType ?? (hasLegacy ? inferTriggerFromLegacy(legacySteps) : "MANUAL");
  const actions =
    input.actions?.length
      ? input.actions.map((action, index) => ({
          ...action,
          id: action.id || generateId("action"),
          order: action.order ?? index,
          parameters: action.parameters ?? {},
        }))
      : hasLegacy
        ? legacyStepsToActions(legacySteps)
        : [];

  let status: WorkflowStatus = input.status ?? "draft";
  if (!input.status && typeof input.active === "boolean") {
    status = input.active ? "active" : "paused";
  }

  const aiEnabled =
    input.aiEnabled ??
    (actions.some((a) => AUTOMATION_ACTIONS.find((def) => def.id === a.actionType)?.aiAction) ||
      Boolean(input.aiConfig?.enabled));

  return {
    id: input.id,
    name: input.name,
    description: input.description ?? "",
    status,
    triggerType,
    conditionLogic: input.conditionLogic ?? "all",
    conditions: (input.conditions ?? []).map((c) => ({
      ...c,
      id: c.id || generateId("cond"),
    })),
    actions,
    aiEnabled,
    aiConfig: input.aiConfig ?? {
      enabled: aiEnabled,
      capabilities: aiEnabled ? ["classify_email"] : [],
      confidenceThreshold: 0.8,
      requireApprovalBelowThreshold: true,
    },
    humanApprovalRequired: input.humanApprovalRequired ?? false,
    approvalConfig: input.approvalConfig ?? {
      required: input.humanApprovalRequired ?? false,
      approverRole: "sales_manager",
      timeoutHours: 24,
    },
    priority: input.priority ?? "normal",
    version: input.version ?? 1,
    createdBy: input.createdBy ?? "user-1",
    createdAt: input.createdAt ?? now,
    updatedAt: input.updatedAt ?? now,
    lastRunAt: input.lastRunAt ?? input.lastRun,
    nextRunAt: input.nextRunAt,
    totalRuns: input.totalRuns ?? 0,
    successfulRuns: input.successfulRuns ?? 0,
    failedRuns: input.failedRuns ?? 0,
    schedule: input.schedule,
    metadata: { mockMode: true, ...(input.metadata ?? {}) },
    active: status === "active",
    steps: legacySteps.length ? legacySteps : undefined,
    lastRun: input.lastRunAt ?? input.lastRun,
  };
}

export type WorkflowValidationResult = {
  valid: boolean;
  errors: string[];
  canActivate: boolean;
};

export function validateWorkflowData(workflow: Partial<AutomationWorkflow>): WorkflowValidationResult {
  const errors: string[] = [];
  if (!workflow.name?.trim()) errors.push("Name is required");
  if (!workflow.triggerType) errors.push("Trigger is required");
  if (!workflow.actions?.length) errors.push("At least one action is required");
  if (workflow.triggerType === "SCHEDULED" && !workflow.schedule?.frequency) {
    errors.push("Schedule configuration is required for scheduled workflows");
  }
  const canActivate = errors.length === 0 && workflow.status !== "archived";
  return { valid: errors.length === 0, errors, canActivate };
}

export function buildWorkflowSummary(workflow: AutomationWorkflow): string {
  const trigger = getTriggerLabel(workflow.triggerType).toLowerCase();
  const conditionText =
    workflow.conditions.length > 0
      ? ` when ${workflow.conditionLogic === "all" ? "all" : "any"} conditions match`
      : "";
  const actionText = workflow.actions
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((a) => getActionLabel(a.actionType).toLowerCase())
    .join(", ");
  const approval = workflow.humanApprovalRequired ? " (requires human approval)" : "";
  const ai = workflow.aiEnabled ? " with AI assistance" : "";
  return `When ${trigger}${conditionText}, ${actionText || "no actions configured"}${ai}${approval}.`;
}

export function normalizeExecution(
  input: Partial<AutomationExecutionRecord> & { id: string; workflowId: string }
): AutomationExecutionRecord {
  const now = new Date().toISOString();
  return {
    id: input.id,
    workflowId: input.workflowId,
    workflowVersion: input.workflowVersion ?? 1,
    status: input.status ?? "queued",
    triggerType: input.triggerType ?? "MANUAL",
    triggeredAt: input.triggeredAt ?? now,
    startedAt: input.startedAt,
    completedAt: input.completedAt,
    durationMs: input.durationMs,
    currentStep: input.currentStep ?? 0,
    totalSteps: input.totalSteps ?? input.steps?.length ?? 0,
    retryCount: input.retryCount ?? 0,
    parentExecutionId: input.parentExecutionId,
    errorMessage: input.errorMessage,
    resultSummary: input.resultSummary,
    steps: input.steps ?? [],
    approvalStatus: input.approvalStatus,
    metadata: { mockMode: true, ...(input.metadata ?? {}) },
  };
}

export const seedAutomationExecutions: AutomationExecutionRecord[] = [
  normalizeExecution({
    id: "exec-1",
    workflowId: "wf-1",
    workflowVersion: 1,
    status: "succeeded",
    triggerType: "EMAIL_RECEIVED",
    triggeredAt: "2026-09-01T05:10:00Z",
    startedAt: "2026-09-01T05:10:01Z",
    completedAt: "2026-09-01T05:10:03Z",
    durationMs: 2000,
    currentStep: 4,
    totalSteps: 4,
    resultSummary: "Email classified and follow-up created",
    metadata: { ownerId: "user-5", customerId: "cust-6", dealId: "deal-9" },
    steps: [
      { id: "es-1", name: "Trigger: Email received", type: "trigger", status: "succeeded", message: "Matched incoming email event" },
      { id: "es-2", name: "Conditions evaluated", type: "condition", status: "succeeded", message: "All conditions passed" },
      { id: "es-3", name: "Classify email", type: "action", status: "succeeded", message: "Intent: quotation (mock)" },
      { id: "es-4", name: "Create follow-up", type: "action", status: "succeeded", message: "Follow-up scheduled" },
    ],
  }),
  normalizeExecution({
    id: "exec-2",
    workflowId: "wf-2",
    workflowVersion: 1,
    status: "waiting_approval",
    triggerType: "PO_RECEIVED",
    triggeredAt: "2026-08-29T11:00:00Z",
    startedAt: "2026-08-29T11:00:01Z",
    currentStep: 3,
    totalSteps: 5,
    resultSummary: "AI extraction complete — awaiting manager approval",
    approvalStatus: "pending",
    metadata: { aiConfidence: 0.62, requiresApproval: true, ownerId: "user-7", poId: "po-8", customerId: "cust-8" },
    steps: [
      { id: "es-5", name: "Trigger: PO received", type: "trigger", status: "succeeded" },
      { id: "es-6", name: "AI extract data", type: "action", status: "succeeded", message: "Confidence: 62% (mock)" },
      { id: "es-7", name: "Human approval", type: "approval", status: "waiting_approval", message: "Awaiting sales_manager approval" },
      { id: "es-8", name: "Create PO review task", type: "action", status: "pending" },
      { id: "es-9", name: "Notify manager", type: "action", status: "pending" },
    ],
  }),
  normalizeExecution({
    id: "exec-3",
    workflowId: "wf-1",
    workflowVersion: 1,
    status: "failed",
    triggerType: "EMAIL_RECEIVED",
    triggeredAt: "2026-08-28T14:20:00Z",
    startedAt: "2026-08-28T14:20:01Z",
    completedAt: "2026-08-28T14:20:02Z",
    durationMs: 1000,
    retryCount: 0,
    errorMessage: "Mock integration unavailable — email service not connected",
    resultSummary: "Failed at classify email step",
    metadata: { ownerId: "user-2", customerId: "cust-1" },
    steps: [
      { id: "es-10", name: "Trigger: Email received", type: "trigger", status: "succeeded" },
      { id: "es-11", name: "Classify email", type: "action", status: "failed", message: "Email integration unavailable (mock)" },
    ],
  }),
  normalizeExecution({
    id: "exec-4",
    workflowId: "wf-2",
    workflowVersion: 1,
    status: "waiting_approval",
    triggerType: "PO_RECEIVED",
    triggeredAt: "2026-09-02T10:00:00Z",
    startedAt: "2026-09-02T10:00:01Z",
    currentStep: 3,
    totalSteps: 5,
    resultSummary: "PO extraction awaiting Team A manager approval",
    approvalStatus: "pending",
    metadata: { aiConfidence: 0.71, requiresApproval: true, ownerId: "user-5", poId: "po-6", customerId: "cust-6" },
    steps: [
      { id: "es-12", name: "Trigger: PO received", type: "trigger", status: "succeeded" },
      { id: "es-13", name: "AI extract data", type: "action", status: "succeeded", message: "Confidence: 71% (mock)" },
      { id: "es-14", name: "Human approval", type: "approval", status: "waiting_approval", message: "Awaiting sales_manager approval" },
      { id: "es-15", name: "Create PO review task", type: "action", status: "pending" },
      { id: "es-16", name: "Notify manager", type: "action", status: "pending" },
    ],
  }),
  normalizeExecution({
    id: "exec-5",
    workflowId: "wf-2",
    workflowVersion: 1,
    status: "waiting_approval",
    triggerType: "PO_RECEIVED",
    triggeredAt: "2026-09-02T11:30:00Z",
    startedAt: "2026-09-02T11:30:01Z",
    currentStep: 3,
    totalSteps: 5,
    resultSummary: "PO extraction awaiting Team B manager approval",
    approvalStatus: "pending",
    metadata: { aiConfidence: 0.58, requiresApproval: true, ownerId: "user-8", poId: "po-9", customerId: "cust-9" },
    steps: [
      { id: "es-17", name: "Trigger: PO received", type: "trigger", status: "succeeded" },
      { id: "es-18", name: "AI extract data", type: "action", status: "succeeded", message: "Confidence: 58% (mock)" },
      { id: "es-19", name: "Human approval", type: "approval", status: "waiting_approval", message: "Awaiting sales_manager approval" },
      { id: "es-20", name: "Create PO review task", type: "action", status: "pending" },
      { id: "es-21", name: "Notify manager", type: "action", status: "pending" },
    ],
  }),
];
