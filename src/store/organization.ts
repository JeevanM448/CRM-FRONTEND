import type { DealStage, POStatus } from "@/types";
import type { OrganizationLogo } from "./organizationLogo";

export type OrgDateFormat = "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD";
export type SupportedCurrency = "USD" | "EUR" | "GBP" | "INR" | "AED" | "SGD";
export type ConfigStatus = "active" | "inactive";

export interface OrganizationSettings {
  id: string;
  companyName: string;
  legalName: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  currency: SupportedCurrency;
  timezone: string;
  dateFormat: OrgDateFormat;
  fiscalYearStartMonth: number;
  defaultLanguage: string;
}

export interface BusinessRules {
  defaultFollowUpDays: number;
  useOrganizationCurrencyForDeals: boolean;
  defaultTargetPeriod: string;
  poReviewRequired: boolean;
}

export interface OrganizationTeam {
  id: string;
  name: string;
  code: string;
  status: ConfigStatus;
  createdAt: string;
  updatedAt: string;
}

export interface SalesRegion {
  id: string;
  name: string;
  code: string;
  status: ConfigStatus;
  createdAt: string;
  updatedAt: string;
}

export interface PipelineStageConfig {
  id: DealStage;
  label: string;
  order: number;
  status: ConfigStatus;
}

export interface POStatusConfig {
  id: POStatus;
  label: string;
  order: number;
  status: ConfigStatus;
}

export interface OrganizationState {
  settings: OrganizationSettings;
  logo: OrganizationLogo | null;
  businessRules: BusinessRules;
  teams: OrganizationTeam[];
  regions: SalesRegion[];
  pipelineStages: PipelineStageConfig[];
  poStatuses: POStatusConfig[];
}

export const SUPPORTED_CURRENCIES: SupportedCurrency[] = [
  "USD",
  "EUR",
  "GBP",
  "INR",
  "AED",
  "SGD",
];

export const SUPPORTED_TIMEZONES = [
  "Asia/Kolkata",
  "Asia/Dubai",
  "Asia/Singapore",
  "Europe/London",
  "Europe/Berlin",
  "America/New_York",
  "America/Los_Angeles",
  "UTC",
] as const;

export const DATE_FORMAT_OPTIONS: OrgDateFormat[] = [
  "DD/MM/YYYY",
  "MM/DD/YYYY",
  "YYYY-MM-DD",
];

const DEFAULT_STAGE_LABELS: Record<DealStage, string> = {
  new: "New Lead",
  qualified: "Qualified",
  quotation: "Quotation",
  negotiation: "Negotiation",
  won: "Won",
  lost: "Lost",
};

const DEFAULT_PO_LABELS: Record<POStatus, string> = {
  pending: "Pending",
  received: "Received",
  approved: "Approved",
  processing: "Processing",
  completed: "Completed",
  cancelled: "Cancelled",
};

const DEAL_STAGE_ORDER: DealStage[] = [
  "new",
  "qualified",
  "quotation",
  "negotiation",
  "won",
  "lost",
];

const PO_STATUS_ORDER: POStatus[] = [
  "pending",
  "received",
  "approved",
  "processing",
  "completed",
  "cancelled",
];

export function createDefaultOrganizationState(now = new Date().toISOString()): OrganizationState {
  return {
    settings: {
      id: "org-1",
      companyName: "Shiny Stone Industries",
      legalName: "Shiny Stone Industries Pvt. Ltd.",
      email: "info@shinystone.com",
      phone: "+91 80 5555 0100",
      website: "https://shinystone.com",
      address: "12 Industrial Estate Road",
      city: "Bengaluru",
      state: "Karnataka",
      country: "India",
      postalCode: "560001",
      currency: "INR",
      timezone: "Asia/Kolkata",
      dateFormat: "DD/MM/YYYY",
      fiscalYearStartMonth: 4,
      defaultLanguage: "en",
    },
    logo: null,
    businessRules: {
      defaultFollowUpDays: 7,
      useOrganizationCurrencyForDeals: true,
      defaultTargetPeriod: "2026-Q3",
      poReviewRequired: true,
    },
    teams: [
      {
        id: "team-a",
        name: "Team A",
        code: "TEAM-A",
        status: "active",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "team-b",
        name: "Team B",
        code: "TEAM-B",
        status: "active",
        createdAt: now,
        updatedAt: now,
      },
    ],
    regions: [
      {
        id: "region-na",
        name: "North America",
        code: "NA",
        status: "active",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "region-eu",
        name: "Europe",
        code: "EU",
        status: "active",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "region-me",
        name: "Middle East",
        code: "ME",
        status: "active",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "region-in",
        name: "India",
        code: "IN",
        status: "active",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "region-apac",
        name: "Asia Pacific",
        code: "APAC",
        status: "active",
        createdAt: now,
        updatedAt: now,
      },
    ],
    pipelineStages: DEAL_STAGE_ORDER.map((id, index) => ({
      id,
      label: DEFAULT_STAGE_LABELS[id],
      order: index + 1,
      status: "active" as ConfigStatus,
    })),
    poStatuses: PO_STATUS_ORDER.map((id, index) => ({
      id,
      label: DEFAULT_PO_LABELS[id],
      order: index + 1,
      status: "active" as ConfigStatus,
    })),
  };
}

export function getStageLabelMap(stages: PipelineStageConfig[]): Record<DealStage, string> {
  const map = { ...DEFAULT_STAGE_LABELS };
  for (const stage of stages) {
    map[stage.id] = stage.label;
  }
  return map;
}

export function getActivePipelineStages(stages: PipelineStageConfig[]): PipelineStageConfig[] {
  return [...stages]
    .filter((stage) => stage.status === "active")
    .sort((a, b) => a.order - b.order);
}

export function getActivePOStatuses(statuses: POStatusConfig[]): POStatusConfig[] {
  return [...statuses]
    .filter((status) => status.status === "active")
    .sort((a, b) => a.order - b.order);
}

export function getActiveTeams(teams: OrganizationTeam[]): OrganizationTeam[] {
  return teams.filter((team) => team.status === "active");
}

export function countUsersOnTeam(users: { team?: string }[], teamName: string): number {
  return users.filter((user) => user.team === teamName).length;
}

export function teamHasInactiveMembers(
  team: OrganizationTeam,
  users: { team?: string }[]
): boolean {
  return team.status === "inactive" && countUsersOnTeam(users, team.name) > 0;
}
