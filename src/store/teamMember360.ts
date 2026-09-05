import type { Contact, EmailThread, User } from "@/types";
import type { CRMState } from "./types";
import { canViewManagedMember } from "./scope";
import { enrichDeal, getUserById } from "./helpers";
import {
  getSalespersonDetail,
  getPerformanceStatus,
  type SalespersonDetail,
} from "./salesTeam";

export interface TeamMember360Kpis {
  salesAchieved: number;
  target: number;
  targetAchievement: number;
  pipeline: number;
  wonDeals: number;
  winRate: number;
  activeDeals: number;
  lostDeals: number;
  overdueFollowUps: number;
}

export type TeamMemberAttentionType =
  | "overdue_follow_up"
  | "attention_deal"
  | "low_achievement"
  | "high_priority_deal";

export interface TeamMemberAttentionItem {
  id: string;
  type: TeamMemberAttentionType;
  title: string;
  description: string;
  href: string;
  priority?: "low" | "medium" | "high";
}

export interface TeamMember360Data {
  member: User;
  manager?: User;
  detail: SalespersonDetail;
  kpis: TeamMember360Kpis;
  contacts: Contact[];
  emails: EmailThread[];
  attentionItems: TeamMemberAttentionItem[];
}

function buildAttentionItems(
  state: CRMState,
  detail: SalespersonDetail,
  kpis: TeamMember360Kpis
): TeamMemberAttentionItem[] {
  const items: TeamMemberAttentionItem[] = [];

  detail.followUps
    .filter((item) => item.status === "overdue")
    .slice(0, 4)
    .forEach((followUp) => {
      items.push({
        id: `follow-up-${followUp.id}`,
        type: "overdue_follow_up",
        title: followUp.title,
        description: `${followUp.customerName} · overdue`,
        href: "/follow-ups",
        priority: followUp.priority ?? "high",
      });
    });

  detail.deals
    .map((deal) => enrichDeal(deal, state))
    .filter((deal) => deal.attentionReason && deal.stage !== "won" && deal.stage !== "lost")
    .slice(0, 4)
    .forEach((deal) => {
      items.push({
        id: `deal-${deal.id}`,
        type: "attention_deal",
        title: deal.customerName ?? deal.title,
        description: deal.attentionReason ?? "Requires attention",
        href: `/deals/${deal.id}`,
        priority: deal.priority,
      });
    });

  detail.deals
    .filter((deal) => deal.priority === "high" && deal.stage !== "won" && deal.stage !== "lost")
    .slice(0, 2)
    .forEach((deal) => {
      if (items.some((item) => item.id === `deal-${deal.id}`)) return;
      items.push({
        id: `priority-${deal.id}`,
        type: "high_priority_deal",
        title: deal.title,
        description: `High-value opportunity · ${deal.customerName}`,
        href: `/deals/${deal.id}`,
        priority: "high",
      });
    });

  if (getPerformanceStatus(kpis.targetAchievement) === "behind") {
    items.push({
      id: "low-achievement",
      type: "low_achievement",
      title: "Below target achievement",
      description: `${kpis.targetAchievement}% of ${kpis.target > 0 ? "assigned target" : "target"}`,
      href: "/reports",
      priority: "medium",
    });
  }

  return items.slice(0, 8);
}

/** Manager-scoped team member 360 payload. Returns null when access is denied. */
export function getTeamMember360Data(
  state: CRMState,
  managerId: string,
  memberId: string
): TeamMember360Data | null {
  const manager = getUserById(state, managerId);
  if (!manager || manager.role !== "sales_manager") return null;
  if (!canViewManagedMember(manager, memberId, state)) return null;

  const member = getUserById(state, memberId);
  if (!member || member.role !== "salesperson") return null;

  const detail = getSalespersonDetail(state, memberId);
  if (!detail) return null;

  const { metrics } = detail;
  const closedDeals = metrics.wonCount + metrics.lostCount;
  const winRate = closedDeals > 0 ? Math.round((metrics.wonCount / closedDeals) * 100) : 0;

  const kpis: TeamMember360Kpis = {
    salesAchieved: metrics.sales,
    target: metrics.target,
    targetAchievement: metrics.achievement,
    pipeline: metrics.pipeline,
    wonDeals: metrics.wonCount,
    winRate,
    activeDeals: metrics.activeCount,
    lostDeals: metrics.lostCount,
    overdueFollowUps: metrics.overdueCount,
  };

  const customerIds = new Set(detail.customers.map((customer) => customer.id));
  const dealIds = new Set(detail.deals.map((deal) => deal.id));

  const contacts = state.contacts.filter((contact) => contact.ownerId === memberId);
  const emails = state.emails.filter(
    (email) =>
      (email.customerId != null && customerIds.has(email.customerId)) ||
      (email.dealId != null && dealIds.has(email.dealId))
  );

  return {
    member,
    manager: member.managerId ? getUserById(state, member.managerId) : undefined,
    detail,
    kpis,
    contacts,
    emails,
    attentionItems: buildAttentionItems(state, detail, kpis),
  };
}
