import type {
  Activity,
  AutomationWorkflow,
  Contact,
  Customer,
  Deal,
  DealStage,
  EmailThread,
  FollowUp,
  PurchaseOrder,
  User,
  UserRole,
} from "@/types";
import type { UserAccount } from "@/types/account";
import type { AppSettings } from "@/store/types";
import type {
  CreateCustomerInput,
  CreateContactInput,
  CreateDealInput,
  CreateFollowUpInput,
  CreatePOInput,
  ComposeEmailInput,
  CreateWorkflowInput,
  CreateUserInput,
  SearchResult,
} from "@/store/helpers";
import type {
  ActivityFilters,
  AIClassification,
  AuthSession,
  DashboardMetrics,
  DealInsight,
  PipelineStageSummary,
  POExtractionResult,
  RevenueChartPoint,
  TeamPerformanceRow,
  ManagerDashboardData,
} from "./types";
import type { SalespersonDetail, SalespersonRow, SalesTeamOverview } from "@/store/salesTeam";

export interface CustomerService {
  getCustomers(): Promise<Customer[]>;
  getCustomer(id: string): Promise<Customer>;
  getTeamCustomers(): Promise<Customer[]>;
  getTeamCustomersSummary(): Promise<import("./types").TeamCustomersSummary>;
  getCustomerAccessStatus(id: string): Promise<import("./types").CustomerAccessStatus>;
  createCustomer(data: CreateCustomerInput): Promise<Customer>;
  updateCustomer(id: string, data: Partial<CreateCustomerInput>): Promise<Customer>;
  deleteCustomer(id: string): Promise<void>;
}

export interface ContactService {
  getContacts(): Promise<Contact[]>;
  getContact(id: string): Promise<Contact>;
  getTeamContacts(): Promise<Contact[]>;
  getTeamContactsSummary(): Promise<import("./types").TeamContactsSummary>;
  getTeamContactOwners(): Promise<import("./types").TeamCustomerOwnerOption[]>;
  getContactAccessStatus(id: string): Promise<import("./types").ContactAccessStatus>;
  createContact(data: CreateContactInput): Promise<Contact>;
  updateContact(id: string, data: Partial<CreateContactInput>): Promise<Contact>;
  deleteContact(id: string): Promise<void>;
}

export interface DealService {
  getDeals(): Promise<Deal[]>;
  getDeal(id: string): Promise<Deal>;
  getDealsByCustomer(customerId: string): Promise<Deal[]>;
  getTeamDeals(): Promise<Deal[]>;
  getTeamDealsSummary(): Promise<import("./types").TeamDealsSummary>;
  getTeamDealOwners(): Promise<import("./types").TeamCustomerOwnerOption[]>;
  getDealAccessStatus(id: string): Promise<import("./types").DealAccessStatus>;
  getTeamPipelineSummary(): Promise<import("./types").TeamPipelineSummary>;
  createDeal(data: CreateDealInput): Promise<Deal>;
  updateDeal(id: string, data: Partial<CreateDealInput>): Promise<Deal>;
  updateDealStage(id: string, stage: DealStage): Promise<Deal>;
  deleteDeal(id: string): Promise<void>;
}

export interface EmailService {
  getEmails(folder?: EmailThread["folder"] | "important"): Promise<EmailThread[]>;
  getEmail(id: string): Promise<EmailThread>;
  getTeamInboxSummary(): Promise<import("./types").TeamInboxSummary>;
  getEmailAccessStatus(id: string): Promise<import("./types").EmailAccessStatus>;
  sendEmail(data: ComposeEmailInput): Promise<EmailThread>;
  saveDraft(data: ComposeEmailInput): Promise<EmailThread>;
  deleteEmail(id: string): Promise<void>;
  markEmailRead(id: string): Promise<void>;
  linkEmailToDeal(emailId: string, dealId: string): Promise<void>;
}

export interface ConnectEmailProviderInput {
  provider: import("@/store/types").EmailProvider;
  accountEmail: string;
  displayName: string;
}

export interface UpdateEmailIntegrationInput {
  syncEnabled?: boolean;
  syncFrequency?: import("@/store/types").EmailSyncFrequency;
  syncDirection?: import("@/store/types").EmailSyncDirection;
  historicalSyncDays?: number;
  displayName?: string;
  metadata?: import("@/store/types").EmailIntegrationRecord["metadata"];
}

export interface EmailIntegrationService {
  getIntegrations(): Promise<import("@/store/types").EmailIntegrationRecord[]>;
  getIntegration(id: string): Promise<import("@/store/types").EmailIntegrationRecord>;
  connectProvider(input: ConnectEmailProviderInput): Promise<import("@/store/types").EmailIntegrationRecord>;
  disconnectIntegration(id: string): Promise<import("@/store/types").EmailIntegrationRecord>;
  reconnectIntegration(id: string): Promise<import("@/store/types").EmailIntegrationRecord>;
  updateIntegration(
    id: string,
    data: UpdateEmailIntegrationInput
  ): Promise<import("@/store/types").EmailIntegrationRecord>;
  syncIntegration(id: string): Promise<import("@/store/types").EmailSyncRunRecord>;
  getSyncRuns(integrationId: string): Promise<import("@/store/types").EmailSyncRunRecord[]>;
  getSyncStatus(
    integrationId: string
  ): Promise<{ status: import("@/store/types").EmailSyncStatus; lastSyncAt?: string; lastError?: string }>;
}

export interface PurchaseOrderService {
  getPurchaseOrders(): Promise<PurchaseOrder[]>;
  getPurchaseOrder(id: string): Promise<PurchaseOrder>;
  getTeamPurchaseOrders(): Promise<PurchaseOrder[]>;
  getTeamPurchaseOrdersSummary(): Promise<import("./types").TeamPurchaseOrdersSummary>;
  getTeamPOOwners(): Promise<import("./types").TeamCustomerOwnerOption[]>;
  getPurchaseOrderAccessStatus(id: string): Promise<import("./types").PurchaseOrderAccessStatus>;
  createPurchaseOrder(data: CreatePOInput): Promise<PurchaseOrder>;
  updatePurchaseOrder(id: string, data: Partial<CreatePOInput>): Promise<PurchaseOrder>;
  deletePurchaseOrder(id: string): Promise<void>;
}

export interface FollowUpService {
  getFollowUps(): Promise<FollowUp[]>;
  getFollowUpsByDeal(dealId: string): Promise<FollowUp[]>;
  getTeamFollowUps(): Promise<FollowUp[]>;
  getTeamFollowUpsSummary(): Promise<import("./types").TeamFollowUpsSummary>;
  getTeamFollowUpOwners(): Promise<import("./types").TeamCustomerOwnerOption[]>;
  getFollowUpAccessStatus(id: string): Promise<import("./types").FollowUpAccessStatus>;
  createFollowUp(data: CreateFollowUpInput): Promise<FollowUp>;
  updateFollowUp(id: string, data: Partial<CreateFollowUpInput>): Promise<FollowUp>;
  completeFollowUp(id: string): Promise<void>;
  rescheduleFollowUp(id: string, dueDate: string): Promise<void>;
  deleteFollowUp(id: string): Promise<void>;
}

export interface AutomationService {
  getWorkflows(): Promise<AutomationWorkflow[]>;
  getWorkflow(id: string): Promise<AutomationWorkflow>;
  createWorkflow(data: CreateWorkflowInput): Promise<AutomationWorkflow>;
  updateWorkflow(
    id: string,
    data: Partial<CreateWorkflowInput & { status?: AutomationWorkflow["status"] }>
  ): Promise<AutomationWorkflow>;
  activateWorkflow(id: string): Promise<AutomationWorkflow>;
  pauseWorkflow(id: string): Promise<AutomationWorkflow>;
  archiveWorkflow(id: string): Promise<AutomationWorkflow>;
  duplicateWorkflow(id: string): Promise<AutomationWorkflow>;
  getExecutions(workflowId?: string): Promise<import("@/store/types").AutomationExecutionRecord[]>;
  getExecution(id: string): Promise<import("@/store/types").AutomationExecutionRecord>;
  executeWorkflow(
    id: string,
    context?: Record<string, unknown>
  ): Promise<import("@/store/types").AutomationExecutionRecord>;
  retryExecution(executionId: string): Promise<import("@/store/types").AutomationExecutionRecord>;
  approveExecution(executionId: string): Promise<import("@/store/types").AutomationExecutionRecord>;
  rejectExecution(
    executionId: string,
    reason?: string
  ): Promise<import("@/store/types").AutomationExecutionRecord>;
  validateWorkflow(
    data: Partial<AutomationWorkflow>
  ): Promise<import("@/store/automation").WorkflowValidationResult>;
  /** @deprecated Use archiveWorkflow */
  deleteWorkflow(id: string): Promise<void>;
  /** @deprecated Use activateWorkflow / pauseWorkflow */
  toggleWorkflow(id: string): Promise<void>;
  /** @deprecated Use executeWorkflow */
  runWorkflow(id: string): Promise<string[]>;
}

export interface NotificationService {
  getNotifications(): Promise<import("@/store/types").AppNotification[]>;
  getUnreadCount(): Promise<number>;
  markRead(id: string): Promise<void>;
  markAllRead(): Promise<void>;
}

export interface UserService {
  getUsers(): Promise<User[]>;
  createUser(data: CreateUserInput): Promise<User>;
  updateUser(id: string, data: Partial<CreateUserInput>): Promise<User>;
  deactivateUser(id: string): Promise<void>;
}

export interface SettingsService {
  getSettings(): Promise<AppSettings>;
  updateSettings(data: Partial<AppSettings>): Promise<void>;
  resetDemoData(): Promise<void>;
  exportDemoData(): Promise<Record<string, unknown>>;
  search(query: string): Promise<SearchResult[]>;
}

export interface DashboardService {
  getDashboardMetrics(): Promise<DashboardMetrics>;
  getManagerDashboardData(): Promise<ManagerDashboardData | null>;
  getPipeline(): Promise<PipelineStageSummary[]>;
  getAttentionDeals(): Promise<Deal[]>;
  getActivities(filters?: ActivityFilters): Promise<Activity[]>;
  getTeamPerformance(): Promise<TeamPerformanceRow[]>;
  getRevenueChartData(): Promise<RevenueChartPoint[]>;
}

export interface ReportService {
  getReportMetrics(): Promise<DashboardMetrics>;
  getTeamPerformance(): Promise<TeamPerformanceRow[]>;
  getRevenueChartData(): Promise<RevenueChartPoint[]>;
  getPipeline(): Promise<PipelineStageSummary[]>;
}

export interface ActivityService {
  getActivities(filters?: ActivityFilters): Promise<Activity[]>;
}

export interface SalesTeamService {
  getOverview(): Promise<SalesTeamOverview>;
  getSalespeople(): Promise<SalespersonRow[]>;
  getSalesperson(id: string): Promise<SalespersonDetail>;
  getTeamMember360(memberId: string): Promise<import("@/store/teamMember360").TeamMember360Data>;
}

export interface TeamRequestService {
  searchSalespeople(query: string): Promise<import("@/store/teamRequests").TeamRequestCandidate[]>;
  getTeamRequestsForManager(): Promise<import("@/store/teamRequests").TeamRequestView[]>;
  getPendingTeamRequest(
    salespersonId: string,
    type?: import("@/store/types").TeamRequestType
  ): Promise<import("@/store/teamRequests").TeamRequestView | undefined>;
  createTeamRequest(
    salespersonId: string,
    type?: import("@/store/types").TeamRequestType
  ): Promise<import("@/store/types").TeamRequest>;
  cancelTeamRequest(id: string): Promise<void>;
  approveTeamRequest(id: string): Promise<import("@/store/types").TeamRequest>;
  rejectTeamRequest(id: string, rejectionReason?: string): Promise<import("@/store/types").TeamRequest>;
}

export interface AuditLogService {
  getAll(): Promise<import("@/store/auditLogs").AuditLogView[]>;
  getById(id: string): Promise<import("@/store/auditLogs").AuditLogView>;
  getSummary(): Promise<{
    total: number;
    today: number;
    thisWeek: number;
    important: number;
  }>;
}

export interface AuthService {
  /** expectedRole is mock-portal UX only; authorization uses the stored account role. */
  signIn(email: string, password: string, expectedRole?: UserRole): Promise<AuthSession>;
  signOut(): Promise<void>;
  getSession(): Promise<AuthSession | null>;
  getCurrentUser(): Promise<User | null>;
  isEmailAvailable(email: string, excludeUserId?: string): Promise<boolean>;
  getAccountForUser(userId: string): Promise<UserAccount | null>;
  changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    confirmPassword: string
  ): Promise<void>;
  requestPasswordReset(email: string): Promise<void>;
  disableUserAccount(userId: string): Promise<void>;
  enableUserAccount(userId: string): Promise<void>;
  /** Backend-ready invitation hook — no email is sent in mock mode. */
  prepareAccountInvitation(userId: string): Promise<{
    queued: boolean;
    email: string;
    role: UserAccount["role"];
    message: string;
  }>;
}

export interface AIService {
  classifyEmail(
    email: Pick<EmailThread, "subject" | "preview" | "messages">
  ): Promise<AIClassification>;
  summarizeEmail(
    email: Pick<EmailThread, "subject" | "preview" | "messages">
  ): Promise<string>;
  generateReply(
    email: Pick<EmailThread, "from" | "subject" | "messages" | "aiIntent">,
    senderName?: string
  ): Promise<string>;
  recommendFollowUp(
    email: Pick<EmailThread, "subject" | "preview" | "messages">
  ): Promise<{ title: string; priority: "low" | "medium" | "high" }>;
  extractPOFields(input: {
    poNumber?: string;
    customerName?: string;
    amount?: number;
    deliveryDate?: string;
    items?: { name: string; quantity: number; unitPrice: number }[];
  }): Promise<POExtractionResult>;
  getDealInsight(deal: {
    probability: number;
    lastActivity: string;
    stage: string;
    attentionReason?: string;
  }): Promise<DealInsight>;
  getConfiguration(): Promise<import("@/store/ai").AIConfiguration>;
  updateConfiguration(
    data: Partial<import("@/store/ai").AIConfiguration>
  ): Promise<import("@/store/ai").AIConfiguration>;
  getProviders(): Promise<import("@/store/ai").AIProviderDefinition[]>;
  getModels(): Promise<import("@/store/ai").AIModelDefinition[]>;
  getCapabilities(): Promise<import("@/store/ai").AICapabilityDefinition[]>;
  getCapability(id: string): Promise<import("@/store/ai").AICapabilityDefinition>;
  updateCapability(
    id: string,
    data: Partial<import("@/store/ai").AICapabilityDefinition>
  ): Promise<import("@/store/ai").AICapabilityDefinition>;
  getExecutions(
    filters?: import("@/store/ai").AIExecutionFilters
  ): Promise<import("@/store/ai").AIExecutionRecord[]>;
  getExecution(id: string): Promise<import("@/store/ai").AIExecutionRecord>;
  getUsage(filters?: import("@/store/ai").AIUsageFilters): Promise<import("@/store/ai").AIUsageSummary>;
  getAIStatus(): Promise<import("@/store/ai").AIStatusSummary>;
  runCapability(input: import("@/store/ai").RunCapabilityInput): Promise<import("@/store/ai").AIExecutionRecord>;
  retryExecution(executionId: string): Promise<import("@/store/ai").AIExecutionRecord>;
  approveExecution(executionId: string): Promise<import("@/store/ai").AIExecutionRecord>;
  rejectExecution(executionId: string, reason?: string): Promise<import("@/store/ai").AIExecutionRecord>;
}

export interface DocumentService {
  listDocuments(
    filters?: import("@/store/documents").DocumentFilters
  ): Promise<import("@/store/documents").DocumentRecord[]>;
  getDocument(id: string): Promise<import("@/store/documents").DocumentRecord>;
  getDocumentSummary(): Promise<import("@/store/documents").DocumentSummary>;
  getDocumentVersions(id: string): Promise<import("@/store/documents").DocumentVersionRecord[]>;
  getProcessingHistory(id: string): Promise<import("@/store/documents").DocumentProcessingRecord[]>;
  uploadDocument(
    input: import("@/store/documents").DocumentUploadInput
  ): Promise<import("@/store/documents").DocumentRecord>;
  createDocumentVersion(
    id: string,
    input: import("@/store/documents").DocumentVersionInput
  ): Promise<import("@/store/documents").DocumentRecord>;
  updateDocument(
    id: string,
    data: Partial<
      Pick<
        import("@/store/documents").DocumentRecord,
        "name" | "description" | "tags" | "category" | "status"
      >
    >
  ): Promise<import("@/store/documents").DocumentRecord>;
  linkDocument(
    id: string,
    input: import("@/store/documents").DocumentLinkInput
  ): Promise<import("@/store/documents").DocumentRecord>;
  archiveDocument(id: string): Promise<import("@/store/documents").DocumentRecord>;
  requestDeleteDocument(id: string): Promise<import("@/store/documents").DocumentRecord>;
  startDocumentProcessing(
    id: string,
    processingType: import("@/store/documents").DocumentProcessingType,
    options?: { simulateFailure?: boolean; simulateLowConfidence?: boolean }
  ): Promise<import("@/store/documents").DocumentRecord>;
  approveDocumentReview(id: string): Promise<import("@/store/documents").DocumentRecord>;
  rejectDocumentReview(
    id: string,
    reason?: string
  ): Promise<import("@/store/documents").DocumentRecord>;
  getSignedDownloadUrl(id: string): Promise<string>;
  getPreviewUrl(id: string): Promise<string | null>;
}

export interface SystemHealthService {
  getSystemHealth(): Promise<import("@/store/systemHealth").SystemHealthSummary>;
  getHealthServices(): Promise<import("@/store/systemHealth").SystemHealthServiceStatus[]>;
  getHealthService(id: string): Promise<import("@/store/systemHealth").SystemHealthServiceStatus>;
  getHealthHistory(
    serviceId?: string,
    filters?: import("@/store/systemHealth").HealthHistoryFilters
  ): Promise<import("@/store/systemHealth").HealthCheckRecord[]>;
  checkHealth(id: string): Promise<import("@/store/systemHealth").SystemHealthServiceStatus>;
  getIncidents(): Promise<import("@/store/systemHealth").SystemIncidentRecord[]>;
  getSystemHealthStatus(): Promise<import("@/store/systemHealth").SystemHealthSummary>;
}

export interface BackupService {
  getBackups(): Promise<import("@/store/backups").BackupRecord[]>;
  getBackup(id: string): Promise<import("@/store/backups").BackupRecord>;
  createBackup(type?: import("@/store/backups").BackupType): Promise<import("@/store/backups").BackupRecord>;
  getRecoveryPoints(): Promise<import("@/store/backups").RecoveryPointRecord[]>;
  getRecoveryPoint(id: string): Promise<import("@/store/backups").RecoveryPointRecord>;
  simulateRestore(recoveryPointId: string): Promise<{ success: boolean; message: string }>;
  getRetentionPolicy(): Promise<import("@/store/backups").BackupRetentionPolicy>;
  updateRetentionPolicy(
    data: Partial<import("@/store/backups").BackupRetentionPolicy>
  ): Promise<import("@/store/backups").BackupRetentionPolicy>;
  verifyBackup(id: string): Promise<import("@/store/backups").BackupRecord>;
  getBackupSummary(): Promise<import("@/store/backups").BackupSummary>;
  getBackupSecurityReadiness(): Promise<import("@/store/backups").BackupSecurityReadiness>;
}

export type {
  Activity,
  Contact,
  FollowUp,
  PurchaseOrder,
  User,
  AutomationWorkflow,
  CreateContactInput,
  CreateFollowUpInput,
  CreatePOInput,
  CreateWorkflowInput,
  CreateUserInput,
  AIClassification,
  AuthSession,
  DashboardMetrics,
  DealInsight,
  POExtractionResult,
};
