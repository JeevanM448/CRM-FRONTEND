import type { Activity, Deal, DealStage, EmailThread, User, UserRole } from "@/types";
import type { AppNotification } from "@/store/types";

/** Dashboard KPI aggregate — mirrors calculateDashboardMetrics() */
export interface DashboardMetrics {
  totalSales: number;
  openDealsCount: number;
  pipelineValue: number;
  pendingPOCount: number;
  pendingPOValue: number;
  targetAmount: number;
  achievedPercent: number;
  wonCount: number;
  lostCount: number;
  avgDealValue: number;
  winRate: number;
  followUpCompletion: number;
}

export interface PipelineStageSummary {
  stage: DealStage;
  label: string;
  count: number;
  value: number;
}

export interface TeamPerformanceRow {
  name: string;
  deals: number;
  revenue: number;
  target: number;
}

export interface RevenueChartPoint {
  month: string;
  revenue: number;
  target: number;
}

export interface ActivityFilters {
  customerId?: string;
  dealId?: string;
  actorId?: string;
}

export interface AuthSession {
  userId: string;
  email: string;
  name?: string;
  /** Canonical UserRole from the mock user record — not a second enum. */
  role?: UserRole;
  accessToken?: string;
}

export interface AIClassification {
  intent: string;
  priority: "low" | "medium" | "high";
  summary: string;
  suggestedAction: string;
}

export interface POExtractionResult {
  poNumber: string;
  customer: string;
  amount: number;
  deliveryDate: string;
  items: { name: string; quantity: number; unitPrice: number }[];
  tax: number;
  total: number;
  confidence: number;
}

export interface DealInsight {
  probability: number;
  risk: string;
  recommendedAction: string;
}

export type { Activity, AppNotification, Deal, EmailThread, User };

export type {
  PerformanceStatus,
  SalespersonMetrics,
  SalespersonRow,
  SalesTeamOverview,
  SalespersonDetail,
} from "@/store/salesTeam";

export type {
  ManagerDashboardData,
  ManagerDashboardKpis,
  ManagerAttentionItem,
} from "@/store/managerDashboard";

export type {
  TeamMember360Data,
  TeamMember360Kpis,
  TeamMemberAttentionItem,
} from "@/store/teamMember360";

export type {
  TeamCustomersSummary,
  TeamCustomerOwnerOption,
  CustomerAccessStatus,
} from "@/store/teamCustomers";

export type {
  TeamContactsSummary,
  ContactAccessStatus,
} from "@/store/teamContacts";

export type {
  TeamDealsSummary,
  DealAccessStatus,
} from "@/store/teamDeals";

export type {
  TeamPipelineSummary,
  TeamPipelineStageSummary,
} from "@/store/teamPipeline";

export type {
  TeamInboxSummary,
  EmailAccessStatus,
} from "@/store/teamInbox";

export type {
  TeamPurchaseOrdersSummary,
  PurchaseOrderAccessStatus,
} from "@/store/teamPurchaseOrders";

export type {
  TeamFollowUpsSummary,
  FollowUpAccessStatus,
} from "@/store/teamFollowUps";

export type { ManagerTeamTargetSummary } from "@/store/teamTargets";

export type {
  TeamAutomationSummary,
  AutomationExecutionAccessStatus,
} from "@/store/teamAutomation";
