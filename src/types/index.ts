export type UserRole = "admin" | "sales_manager" | "salesperson" | "viewer";

export type DealStage =
  | "new"
  | "qualified"
  | "quotation"
  | "negotiation"
  | "won"
  | "lost";

export type Priority = "low" | "medium" | "high";

export type EntityStatus =
  | "active"
  | "inactive"
  | "pending"
  | "completed"
  | "cancelled";

export type POStatus =
  | "pending"
  | "received"
  | "approved"
  | "processing"
  | "completed"
  | "cancelled";

export type FollowUpStatus = "overdue" | "today" | "upcoming" | "completed";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  team?: string;
  managerId?: string;
  avatar?: string;
  title?: string;
  phone?: string;
  status: EntityStatus;
  lastActive: string;
}

export interface Customer {
  id: string;
  name: string;
  industry: string;
  location: string;
  owner: string;
  ownerId: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  activeDeals: number;
  revenue: number;
  lastActivity: string;
  status: EntityStatus;
}

export interface Contact {
  id: string;
  name: string;
  company: string;
  companyId: string;
  designation: string;
  email: string;
  phone: string;
  owner: string;
  ownerId: string;
  lastContact: string;
  status: EntityStatus;
}

export interface Deal {
  id: string;
  title: string;
  customerId: string;
  customerName: string;
  owner: string;
  ownerId: string;
  value: number;
  stage: DealStage;
  probability: number;
  expectedClose: string;
  lastActivity: string;
  emailCount: number;
  poStatus?: string;
  followUpStatus?: string;
  aiInsight?: string;
  priority?: Priority;
  attentionReason?: string;
}

export interface EmailThread {
  id: string;
  subject: string;
  from: string;
  fromEmail: string;
  preview: string;
  date: string;
  read: boolean;
  important: boolean;
  folder: "inbox" | "important" | "follow-ups" | "sent" | "drafts";
  customerId?: string;
  customerName?: string;
  dealId?: string;
  dealTitle?: string;
  poNumber?: string;
  priority?: Priority;
  aiSummary?: string;
  aiIntent?: string;
  aiSuggestedAction?: string;
  messages?: EmailMessage[];
}

export interface EmailMessage {
  id: string;
  from: string;
  to: string;
  date: string;
  body: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  customerId: string;
  customerName: string;
  dealId: string;
  dealTitle: string;
  amount: number;
  poDate: string;
  deliveryDate: string;
  status: POStatus;
  owner: string;
  ownerId: string;
  items?: POItem[];
  tax?: number;
  total?: number;
  aiConfidence?: number;
  documentName?: string;
  documentSize?: number;
  documentType?: string;
}

export interface POItem {
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface FollowUp {
  id: string;
  title: string;
  description?: string;
  customerId: string;
  customerName: string;
  dealId: string;
  dealTitle: string;
  dueDate: string;
  status: FollowUpStatus;
  priority?: Priority;
  owner: string;
  ownerId: string;
  createdAt?: string;
}

export interface Activity {
  id: string;
  type: string;
  title: string;
  description?: string;
  timestamp: string;
  entityType?: string;
  entityId?: string;
  customerId?: string;
  dealId?: string;
  actorId?: string;
}

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

export interface AutomationWorkflow {
  id: string;
  name: string;
  description: string;
  status: WorkflowStatus;
  triggerType: string;
  conditionLogic: ConditionLogic;
  conditions: AutomationCondition[];
  actions: AutomationActionConfig[];
  aiEnabled: boolean;
  aiConfig?: AutomationAiConfig;
  humanApprovalRequired: boolean;
  approvalConfig?: AutomationApprovalConfig;
  priority: WorkflowPriority;
  version: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  lastRunAt?: string;
  nextRunAt?: string;
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  schedule?: AutomationScheduleConfig;
  metadata?: Record<string, unknown>;
  /** @deprecated Use status === "active" */
  active?: boolean;
  /** @deprecated Legacy visual steps — use triggerType/actions */
  steps?: AutomationStep[];
  /** @deprecated Use lastRunAt */
  lastRun?: string;
}

export interface AutomationStep {
  id: string;
  type: "trigger" | "action";
  label: string;
}

export interface SalesTarget {
  target: number;
  achieved: number;
  period: string;
}

export interface KpiMetric {
  label: string;
  value: string;
  subValue?: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  progress?: number;
}

export interface PipelineStageData {
  stage: DealStage;
  label: string;
  count: number;
  value: number;
}

export interface NavItem {
  title: string;
  href: string;
  icon: string;
  badge?: number;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}
