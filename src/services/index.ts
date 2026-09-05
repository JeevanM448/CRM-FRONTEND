/**
 * Service layer registry — swap mock vs production without changing UI.
 *
 * Mock (default): in-memory store + localStorage via src/services/mock/*
 * Production: Supabase/API via src/services/supabase/* (stubs until backend phases complete)
 */
import { getServiceMode } from "./config";
import type {
  ActivityService,
  AIService,
  AuditLogService,
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
} from "./interfaces";
import { MockAIService } from "./mock/aiServiceAdapter";
import { MockActivityService } from "./mock/activityService";
import { MockAuditLogService } from "./mock/auditLogService";
import { MockAuthService } from "./mock/authService";
import { MockSalesTeamService } from "./mock/salesTeamService";
import { MockTeamRequestService } from "./mock/teamRequestService";
import {
  MockDashboardService,
  MockReportService,
  MockSettingsService,
} from "./mock/aggregatedServices";
import * as automation from "./mock/automationService";
import * as contacts from "./mock/contactService";
import * as customers from "./mock/customerService";
import * as deals from "./mock/dealService";
import * as emails from "./mock/emailService";
import * as emailIntegrations from "./mock/emailIntegrationService";
import * as followUps from "./mock/followUpService";
import * as notifications from "./mock/notificationService";
import * as organization from "./mock/organizationService";
import * as purchaseOrders from "./mock/poService";
import * as documents from "./mock/documentService";
import * as systemHealth from "./mock/systemHealthService";
import * as backups from "./mock/backupService";
import * as users from "./mock/userService";
import {
  supabaseActivityService,
  supabaseAIService,
  supabaseAuditLogService,
  supabaseAuthService,
  supabaseAutomationService,
  supabaseContactService,
  supabaseCustomerService,
  supabaseDashboardService,
  supabaseDealService,
  supabaseDocumentService,
  supabaseSystemHealthService,
  supabaseBackupService,
  supabaseEmailService,
  supabaseEmailIntegrationService,
  supabaseFollowUpService,
  supabaseNotificationService,
  supabaseOrganizationService,
  supabasePurchaseOrderService,
  supabaseReportService,
  supabaseSettingsService,
  supabaseUserService,
  supabaseSalesTeamService,
  supabaseTeamRequestService,
} from "./supabase/stubServices";

export { getServiceMode, isMockMode, isProductionMode } from "./config";
export type * from "./interfaces";
export type * from "./types";

// --- Mock implementations ---

export class MockCustomerService implements CustomerService {
  getCustomers = customers.getCustomers;
  getCustomer = customers.getCustomer;
  getTeamCustomers = customers.getTeamCustomers;
  getTeamCustomersSummary = customers.getTeamCustomersSummary;
  getCustomerAccessStatus = customers.getCustomerAccessStatus;
  createCustomer = customers.createCustomer;
  updateCustomer = customers.updateCustomer;
  deleteCustomer = customers.deleteCustomer;
}

export class MockContactService implements ContactService {
  getContacts = contacts.getContacts;
  getContact = contacts.getContact;
  getTeamContacts = contacts.getTeamContacts;
  getTeamContactsSummary = contacts.getTeamContactsSummary;
  getTeamContactOwners = contacts.getTeamContactOwners;
  getContactAccessStatus = contacts.getContactAccessStatus;
  createContact = contacts.createContact;
  updateContact = contacts.updateContact;
  deleteContact = contacts.deleteContact;
}

export class MockDealService implements DealService {
  getDeals = deals.getDeals;
  getDeal = deals.getDeal;
  getDealsByCustomer = deals.getDealsByCustomer;
  getTeamDeals = deals.getTeamDeals;
  getTeamDealsSummary = deals.getTeamDealsSummary;
  getTeamDealOwners = deals.getTeamDealOwners;
  getDealAccessStatus = deals.getDealAccessStatus;
  getTeamPipelineSummary = deals.getTeamPipelineSummary;
  createDeal = deals.createDeal;
  updateDeal = deals.updateDeal;
  updateDealStage = deals.updateDealStage;
  deleteDeal = deals.deleteDeal;
}

export class MockEmailService implements EmailService {
  getEmails = emails.getEmails;
  getEmail = emails.getEmail;
  getTeamInboxSummary = emails.getTeamInboxSummary;
  getEmailAccessStatus = emails.getEmailAccessStatus;
  sendEmail = emails.sendEmail;
  saveDraft = emails.saveDraft;
  deleteEmail = emails.deleteEmail;
  markEmailRead = emails.markEmailRead;
  linkEmailToDeal = emails.linkEmailToDeal;
}

export class MockEmailIntegrationService implements EmailIntegrationService {
  getIntegrations = emailIntegrations.getIntegrations;
  getIntegration = emailIntegrations.getIntegration;
  connectProvider = emailIntegrations.connectProvider;
  disconnectIntegration = emailIntegrations.disconnectIntegration;
  reconnectIntegration = emailIntegrations.reconnectIntegration;
  updateIntegration = emailIntegrations.updateIntegration;
  syncIntegration = emailIntegrations.syncIntegration;
  getSyncRuns = emailIntegrations.getSyncRuns;
  getSyncStatus = emailIntegrations.getSyncStatus;
}

export class MockPurchaseOrderService implements PurchaseOrderService {
  getPurchaseOrders = purchaseOrders.getPurchaseOrders;
  getPurchaseOrder = purchaseOrders.getPurchaseOrder;
  getTeamPurchaseOrders = purchaseOrders.getTeamPurchaseOrders;
  getTeamPurchaseOrdersSummary = purchaseOrders.getTeamPurchaseOrdersSummary;
  getTeamPOOwners = purchaseOrders.getTeamPOOwners;
  getPurchaseOrderAccessStatus = purchaseOrders.getPurchaseOrderAccessStatus;
  createPurchaseOrder = purchaseOrders.createPurchaseOrder;
  updatePurchaseOrder = purchaseOrders.updatePurchaseOrder;
  deletePurchaseOrder = purchaseOrders.deletePurchaseOrder;
}

export class MockDocumentService implements DocumentService {
  listDocuments = documents.listDocuments;
  getDocument = documents.getDocument;
  getDocumentSummary = documents.getDocumentSummary;
  getDocumentVersions = documents.getDocumentVersions;
  getProcessingHistory = documents.getProcessingHistory;
  uploadDocument = documents.uploadDocument;
  createDocumentVersion = documents.createDocumentVersion;
  updateDocument = documents.updateDocument;
  linkDocument = documents.linkDocument;
  archiveDocument = documents.archiveDocument;
  requestDeleteDocument = documents.requestDeleteDocument;
  startDocumentProcessing = documents.startDocumentProcessing;
  approveDocumentReview = documents.approveDocumentReview;
  rejectDocumentReview = documents.rejectDocumentReview;
  getSignedDownloadUrl = documents.getSignedDownloadUrl;
  getPreviewUrl = documents.getPreviewUrl;
}

export class MockSystemHealthService implements SystemHealthService {
  getSystemHealth = systemHealth.getSystemHealth;
  getHealthServices = systemHealth.getHealthServices;
  getHealthService = systemHealth.getHealthService;
  getHealthHistory = systemHealth.getHealthHistory;
  checkHealth = systemHealth.checkHealth;
  getIncidents = systemHealth.getIncidents;
  getSystemHealthStatus = systemHealth.getSystemHealthStatus;
}

export class MockBackupService implements BackupService {
  getBackups = backups.getBackups;
  getBackup = backups.getBackup;
  createBackup = backups.createBackup;
  getRecoveryPoints = backups.getRecoveryPoints;
  getRecoveryPoint = backups.getRecoveryPoint;
  simulateRestore = backups.simulateRestore;
  getRetentionPolicy = backups.getRetentionPolicy;
  updateRetentionPolicy = backups.updateRetentionPolicy;
  verifyBackup = backups.verifyBackup;
  getBackupSummary = backups.getBackupSummary;
  getBackupSecurityReadiness = backups.getBackupSecurityReadiness;
}

export class MockFollowUpService implements FollowUpService {
  getFollowUps = followUps.getFollowUps;
  getFollowUpsByDeal = followUps.getFollowUpsByDeal;
  getTeamFollowUps = followUps.getTeamFollowUps;
  getTeamFollowUpsSummary = followUps.getTeamFollowUpsSummary;
  getTeamFollowUpOwners = followUps.getTeamFollowUpOwners;
  getFollowUpAccessStatus = followUps.getFollowUpAccessStatus;
  createFollowUp = followUps.createFollowUp;
  updateFollowUp = followUps.updateFollowUp;
  completeFollowUp = followUps.completeFollowUp;
  rescheduleFollowUp = followUps.rescheduleFollowUp;
  deleteFollowUp = followUps.deleteFollowUp;
}

export class MockAutomationService implements AutomationService {
  getWorkflows = automation.getWorkflows;
  getWorkflow = automation.getWorkflow;
  createWorkflow = automation.createWorkflow;
  updateWorkflow = automation.updateWorkflow;
  activateWorkflow = automation.activateWorkflow;
  pauseWorkflow = automation.pauseWorkflow;
  archiveWorkflow = automation.archiveWorkflow;
  duplicateWorkflow = automation.duplicateWorkflow;
  getExecutions = automation.getExecutions;
  getExecution = automation.getExecution;
  executeWorkflow = automation.executeWorkflow;
  retryExecution = automation.retryExecution;
  approveExecution = automation.approveExecution;
  rejectExecution = automation.rejectExecution;
  validateWorkflow = automation.validateWorkflow;
  deleteWorkflow = automation.deleteWorkflow;
  toggleWorkflow = automation.toggleWorkflow;
  runWorkflow = automation.runWorkflow;
}

export class MockNotificationService implements NotificationService {
  getNotifications = notifications.getNotifications;
  getUnreadCount = notifications.getUnreadCount;
  markRead = notifications.markRead;
  markAllRead = notifications.markAllRead;
}

export class MockOrganizationService implements OrganizationService {
  getOrganization = organization.getOrganization;
  updateOrganization = organization.updateOrganization;
  uploadOrganizationLogo = organization.uploadOrganizationLogo;
  removeOrganizationLogo = organization.removeOrganizationLogo;
}

export class MockUserService implements UserService {
  getUsers = users.getUsers;
  createUser = users.createUser;
  updateUser = users.updateUser;
  deactivateUser = users.deactivateUser;
}

const mockServices: {
  customer: CustomerService;
  contact: ContactService;
  deal: DealService;
  email: EmailService;
  emailIntegration: EmailIntegrationService;
  purchaseOrder: PurchaseOrderService;
  document: DocumentService;
  systemHealth: SystemHealthService;
  backup: BackupService;
  followUp: FollowUpService;
  automation: AutomationService;
  notification: NotificationService;
  organization: OrganizationService;
  user: UserService;
  settings: SettingsService;
  dashboard: DashboardService;
  report: ReportService;
  activity: ActivityService;
  salesTeam: SalesTeamService;
  teamRequest: TeamRequestService;
  auditLog: AuditLogService;
  auth: AuthService;
  ai: AIService;
} = {
  customer: new MockCustomerService(),
  contact: new MockContactService(),
  deal: new MockDealService(),
  email: new MockEmailService(),
  emailIntegration: new MockEmailIntegrationService(),
  purchaseOrder: new MockPurchaseOrderService(),
  document: new MockDocumentService(),
  systemHealth: new MockSystemHealthService(),
  backup: new MockBackupService(),
  followUp: new MockFollowUpService(),
  automation: new MockAutomationService(),
  notification: new MockNotificationService(),
  organization: new MockOrganizationService(),
  user: new MockUserService(),
  settings: new MockSettingsService(),
  dashboard: new MockDashboardService(),
  report: new MockReportService(),
  activity: new MockActivityService(),
  salesTeam: new MockSalesTeamService(),
  teamRequest: new MockTeamRequestService(),
  auditLog: new MockAuditLogService(),
  auth: new MockAuthService(),
  ai: new MockAIService(),
} as const;

const productionServices: typeof mockServices = {
  customer: supabaseCustomerService,
  contact: supabaseContactService,
  deal: supabaseDealService,
  email: supabaseEmailService,
  emailIntegration: supabaseEmailIntegrationService,
  purchaseOrder: supabasePurchaseOrderService,
  document: supabaseDocumentService,
  systemHealth: supabaseSystemHealthService,
  backup: supabaseBackupService,
  followUp: supabaseFollowUpService,
  automation: supabaseAutomationService,
  notification: supabaseNotificationService,
  organization: supabaseOrganizationService,
  user: supabaseUserService,
  settings: supabaseSettingsService,
  dashboard: supabaseDashboardService,
  report: supabaseReportService,
  activity: supabaseActivityService,
  salesTeam: supabaseSalesTeamService,
  teamRequest: supabaseTeamRequestService,
  auditLog: supabaseAuditLogService,
  auth: supabaseAuthService,
  ai: supabaseAIService,
} as const;

function resolveServices() {
  return getServiceMode() === "production" ? productionServices : mockServices;
}

export const services = resolveServices();

export const customerService = services.customer;
export const contactService = services.contact;
export const dealService = services.deal;
export const emailService = services.email;
export const emailIntegrationService = services.emailIntegration;
export const purchaseOrderService = services.purchaseOrder;
export const documentService = services.document;
export const systemHealthService = services.systemHealth;
export const backupService = services.backup;
export const followUpService = services.followUp;
export const automationService = services.automation;
export const notificationService = services.notification;
export const organizationService = services.organization;
export const userService = services.user;
export const settingsService = services.settings;
export const dashboardService = services.dashboard;
export const reportService = services.report;
export const activityService = services.activity;
export const salesTeamService = services.salesTeam;
export const teamRequestService = services.teamRequest;
export const auditLogService = services.auditLog;
export const authService = services.auth;
export const aiService = services.ai;
