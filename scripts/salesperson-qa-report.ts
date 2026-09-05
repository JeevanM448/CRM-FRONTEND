/**
 * Salesperson module QA harness (store + route access layer).
 * Run: npx tsx scripts/salesperson-qa-report.ts
 */
import { canAccessPath } from "../src/lib/auth/access";
import { hasPermission, type Permission } from "../src/lib/auth/permissions";
import { applyScope, getDataScope } from "../src/store/scope";
import { globalSearch } from "../src/store/helpers";
import { getCustomerAccessStatus } from "../src/store/teamCustomers";
import { getDealAccessStatus } from "../src/store/teamDeals";
import { getPurchaseOrderAccessStatus } from "../src/store/teamPurchaseOrders";
import { getEmailAccessStatus } from "../src/store/teamInbox";
import { getFollowUpAccessStatus } from "../src/store/teamFollowUps";
import { getAutomationExecutionAccessStatus } from "../src/store/teamAutomation";
import { calculateAchievement } from "../src/store/targets";
import { signIn, signOut } from "../src/services/mock/authService";
import * as store from "../src/store/crmStore";

type Result = "PASS" | "FAIL";

interface Case {
  area: string;
  name: string;
  result: Result;
  detail?: string;
}

const results: Case[] = [];
const JOHN = "user-5";
const SARAH = "user-6";

const SARAH_IDS = {
  customer: "cust-7",
  deal: "deal-11",
  po: "po-7",
  contact: "cont-7",
  followUp: "fu-7",
  email: "email-3",
  execution: "exec-2",
};

function record(area: string, name: string, ok: boolean, detail?: string) {
  results.push({ area, name, result: ok ? "PASS" : "FAIL", detail });
}

function permCheck(role: "salesperson", permission: Permission) {
  return hasPermission(role, permission, store.getRolePermissionsState());
}

function asUser(userId: string) {
  store.setCurrentUser(userId);
}

async function run() {
  store.initStore();

  await signIn("john.smith@shinystone.com", "demo", "salesperson");
  record("LOGIN", "John sign-in", store.getCurrentUser()?.id === JOHN);
  await signOut();

  const allowed = [
    "/dashboard",
    "/my-performance",
    "/customers",
    "/contacts",
    "/deals",
    "/pipeline",
    "/inbox",
    "/purchase-orders",
    "/follow-ups",
    "/notifications",
    "/search",
    "/reports",
    "/targets",
    "/automation",
    "/settings",
  ];
  const blocked = [
    "/my-team",
    "/permissions",
    "/organization-settings",
    "/users",
    "/audit-logs",
    "/data-management",
    "/ai",
    "/system-health",
    "/backup-recovery",
    "/email-integrations",
  ];

  for (const path of allowed) {
    record(
      "ROUTES",
      `Salesperson allowed ${path}`,
      canAccessPath("salesperson", path, (p) => permCheck("salesperson", p))
    );
  }
  for (const path of blocked) {
    record(
      "ROLE ESCALATION",
      `Salesperson blocked ${path}`,
      !canAccessPath("salesperson", path, (p) => permCheck("salesperson", p))
    );
  }

  asUser(JOHN);
  const slice = applyScope(store.getSnapshot(), getDataScope(store.getSnapshot(), JOHN));
  record("SELF-SCOPE", "John deals owner-only", slice.deals.every((d) => d.ownerId === JOHN));
  record("SELF-SCOPE", "John customers owner-only", slice.customers.every((c) => c.ownerId === JOHN));
  record("SELF-SCOPE", "John notifications self-only", slice.notifications.every((n) => n.userId === JOHN));
  record(
    "SELF-SCOPE",
    "John targets self-only",
    slice.salesTargets.every((t) => t.userId === JOHN)
  );

  record(
    "CROSS-SALESPERSON",
    "John blocked Sarah customer",
    getCustomerAccessStatus(store.getSnapshot(), JOHN, SARAH_IDS.customer) === "denied"
  );
  record(
    "CROSS-SALESPERSON",
    "John blocked Sarah deal",
    getDealAccessStatus(store.getSnapshot(), JOHN, SARAH_IDS.deal) === "denied"
  );
  record(
    "CROSS-SALESPERSON",
    "John blocked Sarah PO",
    getPurchaseOrderAccessStatus(store.getSnapshot(), JOHN, SARAH_IDS.po) === "denied"
  );
  record(
    "CROSS-SALESPERSON",
    "John blocked Sarah follow-up",
    getFollowUpAccessStatus(store.getSnapshot(), JOHN, SARAH_IDS.followUp) === "denied"
  );
  record(
    "CROSS-SALESPERSON",
    "John blocked Sarah email",
    getEmailAccessStatus(store.getSnapshot(), JOHN, SARAH_IDS.email) === "denied"
  );
  record(
    "CROSS-SALESPERSON",
    "John blocked Sarah automation exec",
    getAutomationExecutionAccessStatus(store.getSnapshot(), JOHN, SARAH_IDS.execution) === "denied"
  );

  const johnSearch = globalSearch(slice, "Sarah");
  record(
    "SEARCH LEAKAGE",
    "John search no Sarah results",
    !johnSearch.some((r) => r.title.includes("Sarah") || r.subtitle?.includes("Sarah"))
  );
  const pacificSearch = globalSearch(slice, "Pacific");
  record("SEARCH LEAKAGE", "John search no Pacific Foods", !pacificSearch.some((r) => r.title.includes("Pacific")));

  const ownTargets = store.getSalespersonOwnTargetRows();
  record("TARGETS", "John own target rows", ownTargets.every((r) => r.user.id === JOHN));
  const ownSummary = store.getSalespersonOwnTargetSummary();
  record("TARGETS", "John target summary finite", Number.isFinite(ownSummary.achievementPercent));

  record("CALCULATIONS", "Zero target safe", calculateAchievement(100, 0) === 0);
  const metrics = store.getDashboardMetrics();
  record(
    "CALCULATIONS",
    "John metrics finite",
    Number.isFinite(metrics.totalSales) &&
      Number.isFinite(metrics.pipelineValue) &&
      !Number.isNaN(metrics.winRate)
  );

  const detail = store.getSalespersonDetail(JOHN);
  record("PROFILE", "John self profile", detail?.user.id === JOHN);
  record("PROFILE", "John cannot view Sarah profile", store.getSalespersonDetail(SARAH) === undefined);

  const docsBefore = globalSearch(slice, "invoice").filter((r) => r.type === "document");
  record("DOCUMENTS", "John document search scoped", docsBefore.every((d) => !d.title.includes("Admin")));

  asUser(store.getSnapshot().users.find((u) => u.role === "admin")!.id);
  const adminSlice = applyScope(store.getSnapshot(), getDataScope(store.getSnapshot(), store.getCurrentUser()!.id));
  record(
    "ADMIN REGRESSION",
    "Admin org-wide customers",
    adminSlice.customers.length === store.getSnapshot().customers.length
  );

  asUser("user-9");
  const mayaSlice = applyScope(store.getSnapshot(), getDataScope(store.getSnapshot(), "user-9"));
  record(
    "MANAGER REGRESSION",
    "Manager A has team customers",
    mayaSlice.customers.some((c) => c.ownerId === JOHN)
  );
  record(
    "MANAGER REGRESSION",
    "Manager A no Sarah-only isolation leak via team",
    mayaSlice.customers.some((c) => c.id === SARAH_IDS.customer)
  );

  const passed = results.filter((r) => r.result === "PASS").length;
  const failed = results.filter((r) => r.result === "FAIL");

  console.log("\n=== SALESPERSON QA SUMMARY ===");
  console.log(`TOTAL: ${results.length} | PASS: ${passed} | FAIL: ${failed.length}`);
  if (failed.length) {
    console.log("\n--- FAILURES ---");
    for (const f of failed) console.log(`[${f.area}] ${f.name}${f.detail ? ` — ${f.detail}` : ""}`);
  }
  process.exit(failed.length ? 1 : 0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
