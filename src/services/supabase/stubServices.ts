/**
 * Production (Supabase/API) service stubs.
 * Each method throws until the corresponding backend phase is implemented.
 * Set NEXT_PUBLIC_USE_MOCK_SERVICES=true to use mock services during development.
 */

function notImplemented(phase: string, service: string): never {
  throw new Error(
    `[${service}] Production backend not implemented (Phase ${phase}). ` +
      "Set NEXT_PUBLIC_USE_MOCK_SERVICES=true or complete the backend integration phase."
  );
}

import type {
  ActivityService,
  AIService,
  AuthService,
  AutomationService,
  ContactService,
  CustomerService,
  DashboardService,
  DealService,
  DocumentService,
  SystemHealthService,
  BackupService,
  EmailService,
  EmailIntegrationService,
  FollowUpService,
  NotificationService,
  OrganizationService,
  PurchaseOrderService,
  ReportService,
  SettingsService,
  UserService,
  SalesTeamService,
  TeamRequestService,
  AuditLogService,
} from "../interfaces";

function stubService<T extends object>(phase: string, name: string): T {
  return new Proxy({} as T, {
    get(_target, prop) {
      if (prop === "then") return undefined;
      return () => Promise.reject(notImplemented(phase, `${name}.${String(prop)}`));
    },
  });
}

export const supabaseCustomerService = stubService<CustomerService>("5", "CustomerService");
export const supabaseContactService = stubService<ContactService>("5", "ContactService");
export const supabaseDealService = stubService<DealService>("6", "DealService");
export const supabaseEmailService = stubService<EmailService>("8", "EmailService");
export const supabaseEmailIntegrationService = stubService<EmailIntegrationService>(
  "8",
  "EmailIntegrationService"
);
export const supabasePurchaseOrderService = stubService<PurchaseOrderService>(
  "10",
  "PurchaseOrderService"
);
export const supabaseDocumentService = stubService<DocumentService>("11", "DocumentService");
export const supabaseSystemHealthService = stubService<SystemHealthService>(
  "12",
  "SystemHealthService"
);
export const supabaseBackupService = stubService<BackupService>("12", "BackupService");
export const supabaseFollowUpService = stubService<FollowUpService>("11", "FollowUpService");
export const supabaseAutomationService = stubService<AutomationService>("12", "AutomationService");
export const supabaseNotificationService = stubService<NotificationService>(
  "14",
  "NotificationService"
);
export const supabaseOrganizationService = stubService<OrganizationService>(
  "4",
  "OrganizationService"
);
export const supabaseUserService = stubService<UserService>("4", "UserService");
export const supabaseSettingsService = stubService<SettingsService>("4", "SettingsService");
export const supabaseDashboardService = stubService<DashboardService>("13", "DashboardService");
export const supabaseReportService = stubService<ReportService>("13", "ReportService");
export const supabaseActivityService = stubService<ActivityService>("7", "ActivityService");
export const supabaseAuthService = stubService<AuthService>("3", "AuthService");
export const supabaseAIService = stubService<AIService>("9", "AIService");
export const supabaseSalesTeamService = stubService<SalesTeamService>("13", "SalesTeamService");
export const supabaseTeamRequestService = stubService<TeamRequestService>("13", "TeamRequestService");
export const supabaseAuditLogService = stubService<AuditLogService>("13", "AuditLogService");
