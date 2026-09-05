import type {
  Activity,
  AutomationWorkflow,
  Contact,
  Customer,
  Deal,
  EmailThread,
  FollowUp,
  PurchaseOrder,
  User,
} from "@/types";
import type { RolePermissionMap } from "@/lib/auth/permissions";
import type { OrganizationState } from "./organization";
import type {
  AIConfiguration,
  AICapabilityDefinition,
  AIExecutionRecord,
} from "./ai";
import type {
  DocumentProcessingRecord,
  DocumentRecord,
  DocumentVersionRecord,
} from "./documents";
import type {
  BackupRecord,
  BackupRetentionPolicy,
  RecoveryPointRecord,
} from "./backups";
import type {
  HealthCheckRecord,
  SystemHealthServiceStatus,
  SystemIncidentRecord,
} from "./systemHealth";

export type TargetPeriodType = "monthly" | "quarterly" | "yearly";
export type TargetType = "salesperson" | "team";
export type TargetStatus = "active" | "archived";

export interface SalesTargetRecord {
  id: string;
  userId: string;
  period: string;
  periodType: TargetPeriodType;
  targetType: TargetType;
  targetAmount: number;
  achievedAmount: number;
  status: TargetStatus;
  team?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TargetHistoryRecord {
  id: string;
  targetId: string;
  previousAmount: number;
  newAmount: number;
  changedBy: string;
  changedAt: string;
  reason?: string;
}

export type NotificationSeverity = "info" | "warning" | "critical" | "success";

export type NotificationType =
  | "email"
  | "deal"
  | "follow-up"
  | "po"
  | "ai"
  | "system"
  | "team_request"
  | "automation"
  | "target"
  | "security"
  | "document"
  | "system_health"
  | "backup";

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  severity: NotificationSeverity;
  read: boolean;
  timestamp: string;
  href?: string;
  entityType?: AuditEntityType | string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}

export interface AppSettings {
  aiEnabled: boolean;
  emailAutoLink: boolean;
  autoFollowUp: boolean;
  companyName: string;
  defaultCurrency: string;
  timezone: string;
}

export type TeamRequestStatus = "pending" | "approved" | "rejected";
export type TeamRequestType = "add" | "remove";

export interface TeamRequest {
  id: string;
  type: TeamRequestType;
  salespersonId: string;
  managerId: string;
  status: TeamRequestStatus;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
}

export type AuditAction =
  | "created"
  | "updated"
  | "deleted"
  | "approved"
  | "rejected"
  | "assigned"
  | "unassigned"
  | "activated"
  | "deactivated"
  | "login"
  | "logout"
  | "login_failed"
  | "account_created"
  | "account_disabled"
  | "account_enabled"
  | "account_updated"
  | "password_reset_requested"
  | "exported"
  | "imported"
  | "connected"
  | "disconnected"
  | "reconnected";

export type AuditEntityType =
  | "user"
  | "customer"
  | "contact"
  | "deal"
  | "purchase_order"
  | "follow_up"
  | "team_request"
  | "sales_target"
  | "automation"
  | "automation_execution"
  | "ai_configuration"
  | "ai_capability"
  | "ai_execution"
  | "email"
  | "email_integration"
  | "document"
  | "system_health"
  | "backup"
  | "system"
  | "organization"
  | "team"
  | "region"
  | "user_account";

export type EmailProvider = "gmail" | "outlook";
export type EmailConnectionType = "oauth";
export type EmailIntegrationStatus = "connected" | "disconnected" | "connecting" | "error";
export type EmailSyncDirection = "inbound" | "outbound" | "two-way";
export type EmailSyncFrequency = "15m" | "30m" | "1h" | "6h" | "24h" | "manual";
export type EmailSyncStatus = "success" | "failed" | "in_progress" | "idle";
export type EmailSyncRunStatus = "success" | "failed" | "in_progress";

export interface EmailIntegrationRecord {
  id: string;
  provider: EmailProvider;
  accountEmail: string;
  displayName: string;
  status: EmailIntegrationStatus;
  connectionType: EmailConnectionType;
  connectedAt?: string;
  lastSyncAt?: string;
  lastSyncStatus: EmailSyncStatus;
  lastSyncError?: string;
  syncEnabled: boolean;
  syncFrequency: EmailSyncFrequency;
  syncDirection: EmailSyncDirection;
  historicalSyncDays?: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  metadata?: {
    linkedCustomersCount?: number;
    linkedDealsCount?: number;
    aiClassificationEnabled?: boolean;
    automationTriggersEnabled?: boolean;
    mockMode?: boolean;
  };
}

export interface EmailSyncRunRecord {
  id: string;
  integrationId: string;
  provider: EmailProvider;
  syncType: "manual" | "scheduled";
  status: EmailSyncRunStatus;
  startedAt: string;
  completedAt?: string;
  messagesProcessed: number;
  messagesCreated: number;
  messagesUpdated: number;
  messagesSkipped: number;
  errorCount: number;
  errors?: string[];
}

export type AuditValue = Record<string, unknown>;

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

export type ApprovalStatus = "pending" | "approved" | "rejected";

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

export interface AutomationExecutionRecord {
  id: string;
  workflowId: string;
  workflowVersion: number;
  status: ExecutionStatus;
  triggerType: string;
  triggeredAt: string;
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
  currentStep: number;
  totalSteps: number;
  retryCount: number;
  parentExecutionId?: string;
  errorMessage?: string;
  resultSummary?: string;
  steps: AutomationExecutionStep[];
  approvalStatus?: ApprovalStatus;
  metadata?: Record<string, unknown>;
}

export interface AuditLog {
  id: string;
  actorId: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  timestamp: string;
  previousValue?: AuditValue;
  newValue?: AuditValue;
  metadata?: AuditValue;
}

export interface CRMState {
  customers: Customer[];
  contacts: Contact[];
  deals: Deal[];
  emails: EmailThread[];
  purchaseOrders: PurchaseOrder[];
  followUps: FollowUp[];
  workflows: AutomationWorkflow[];
  automationExecutions: AutomationExecutionRecord[];
  aiConfiguration: AIConfiguration;
  aiCapabilities: AICapabilityDefinition[];
  aiExecutions: AIExecutionRecord[];
  documents: DocumentRecord[];
  documentVersions: DocumentVersionRecord[];
  documentProcessing: DocumentProcessingRecord[];
  healthServices: SystemHealthServiceStatus[];
  healthCheckHistory: HealthCheckRecord[];
  systemIncidents: SystemIncidentRecord[];
  backups: BackupRecord[];
  recoveryPoints: RecoveryPointRecord[];
  backupRetentionPolicy: BackupRetentionPolicy;
  users: User[];
  userAccounts: import("@/types/account").UserAccount[];
  notifications: AppNotification[];
  activities: Activity[];
  salesTargets: SalesTargetRecord[];
  targetHistory: TargetHistoryRecord[];
  teamRequests: TeamRequest[];
  auditLogs: AuditLog[];
  emailIntegrations: EmailIntegrationRecord[];
  emailSyncRuns: EmailSyncRunRecord[];
  rolePermissions: RolePermissionMap;
  organization: OrganizationState;
  settings: AppSettings;
  currentUserId: string;
}

export const defaultSettings: AppSettings = {
  aiEnabled: true,
  emailAutoLink: true,
  autoFollowUp: true,
  companyName: "Shiny Stone Industries",
  defaultCurrency: "INR",
  timezone: "Asia/Kolkata",
};
