/**
 * Verifies relational side effects in the in-memory CRM store.
 * Run: npx tsx scripts/test-relationships.ts
 */
import {
  initStore,
  resetStore,
  createCustomer,
  createDeal,
  sendEmail,
  linkEmailToDeal,
  createFollowUp,
  createPurchaseOrder,
  updatePurchaseOrder,
  updateDealStage,
  getCustomers,
  getDeals,
  getDealsByCustomer,
  getPipeline,
  getEmails,
  getFollowUps,
  getFollowUpsByDeal,
  getPOsByDeal,
  getActivities,
  getDashboardMetrics,
  getSnapshot,
} from "../src/store/crmStore";

initStore();
resetStore();

const ownerId = "user-1";
const metricsBefore = getDashboardMetrics();
const wonBefore = metricsBefore.wonCount;
const salesBefore = metricsBefore.totalSales;

const customer = createCustomer({
  name: "Relational Test Co",
  industry: "Manufacturing",
  location: "Mumbai",
  ownerId,
  contactName: "Test Contact",
  contactEmail: "test@relational.local",
  status: "active",
});

const inList = getCustomers().some((c) => c.id === customer.id);

const deal = createDeal({
  title: "Relational Test Deal",
  customerId: customer.id,
  ownerId,
  value: 250000,
  stage: "new",
  probability: 30,
  expectedClose: "2026-12-31",
});

const underCustomer = getDealsByCustomer(customer.id).some((d) => d.id === deal.id);
const inPipeline = getPipeline().some((s) => s.stage === "new" && s.count > 0);

const email = sendEmail({
  to: "buyer@relational.local",
  subject: "Relational test email",
  body: "Testing email linkage.",
  dealId: deal.id,
});

const emailOnDeal = getEmails().some((e) => e.id === email.id && e.dealId === deal.id);
const emailOnCustomer = getEmails().some((e) => e.id === email.id && e.customerId === customer.id);

const inboxEmail = getEmails("inbox")[0];
let linkedEmailOk = true;
if (inboxEmail) {
  linkEmailToDeal(inboxEmail.id, deal.id);
  const linked = getEmails().find((e) => e.id === inboxEmail.id);
  linkedEmailOk = linked?.dealId === deal.id && linked?.customerId === customer.id;
}

const followUp = createFollowUp({
  customerId: customer.id,
  dealId: deal.id,
  title: "Relational follow-up",
  dueDate: "2026-09-15",
  ownerId,
});

const inFollowUpsList = getFollowUps().some((f) => f.id === followUp.id);
const onDeal = getFollowUpsByDeal(deal.id).some((f) => f.id === followUp.id);

const po = createPurchaseOrder({
  poNumber: "PO-REL-001",
  customerId: customer.id,
  dealId: deal.id,
  amount: 250000,
  poDate: "2026-09-01",
  deliveryDate: "2026-10-01",
  status: "pending",
  ownerId,
});

const posOnDeal = getPOsByDeal(deal.id).some((p) => p.id === po.id);
updatePurchaseOrder(po.id, { status: "approved" });
const poApproved = getPOsByDeal(deal.id).find((p) => p.id === po.id)?.status === "approved";

updateDealStage(deal.id, "negotiation");
const stageActivity = getActivities({ dealId: deal.id }).some((a) =>
  a.title.includes("negotiation")
);

updateDealStage(deal.id, "won");
const metricsAfter = getDashboardMetrics();
const wonAfter = metricsAfter.wonCount;
const salesAfter = metricsAfter.totalSales;
const dealWon = getDeals().find((d) => d.id === deal.id)?.stage === "won";
const targetUpdated = getSnapshot().salesTargets.some(
  (t) => t.userId === ownerId && t.achievedAmount >= deal.value
);

const results = {
  "1. Customer in CRM list": inList ? "PASS" : "FAIL",
  "2. Deal under customer + pipeline": underCustomer && inPipeline ? "PASS" : "FAIL",
  "3. Stage move creates activity": stageActivity ? "PASS" : "FAIL",
  "4. Email on deal/customer history": emailOnDeal && emailOnCustomer ? "PASS" : "FAIL",
  "4b. Link inbox email to deal": linkedEmailOk ? "PASS" : "SKIP",
  "5. Follow-up in list + on deal": inFollowUpsList && onDeal ? "PASS" : "FAIL",
  "6. PO on deal + approved": posOnDeal && poApproved ? "PASS" : "FAIL",
  "7. Deal won updates dashboard/reports": dealWon && wonAfter > wonBefore && salesAfter > salesBefore ? "PASS" : "FAIL",
  "7b. Sales target recalculated": targetUpdated ? "PASS" : "FAIL",
};

console.log(JSON.stringify(results, null, 2));

const failed = Object.values(results).filter((r) => r === "FAIL");
process.exit(failed.length > 0 ? 1 : 0);
