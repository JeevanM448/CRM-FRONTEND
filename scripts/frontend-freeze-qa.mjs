/**
 * Final frontend freeze QA — real browser via Playwright.
 * Run: node scripts/frontend-freeze-qa.mjs
 */
import { chromium } from "playwright";

const BASE = process.env.QA_BASE_URL || "http://localhost:3000";
const PASSWORD = "demo";

const ACCOUNTS = {
  admin: { email: "jeevan.elias@shinystone.com", portal: "Continue as Admin", nav: "Dashboard" },
  managerA: { email: "maya.fernandez@shinystone.com", portal: "Continue as Manager", nav: "Dashboard" },
  managerB: { email: "priya.nair@shinystone.com", portal: "Continue as Manager", nav: "Dashboard" },
  salesperson: { email: "john.smith@shinystone.com", portal: "Continue as Salesperson", nav: "Dashboard" },
};

const VIEWPORTS = [
  { name: "1440", width: 1440, height: 900 },
  { name: "1024", width: 1024, height: 768 },
  { name: "768", width: 768, height: 1024 },
  { name: "390", width: 390, height: 844 },
];

const results = [];
const criticalConsole = [];

function record(section, name, pass, detail = "") {
  results.push({ section, name, pass, detail });
}

async function clearStorage(page) {
  await page.goto(`${BASE}/login`);
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

async function clickPortal(page, portalName) {
  await page.getByRole("button", { name: portalName, exact: true }).click();
}

async function login(page, account, emailOverride) {
  await clearStorage(page);
  await page.goto(`${BASE}/login`);
  await clickPortal(page, account.portal);
  await page.locator("#email").fill(emailOverride ?? account.email);
  await page.locator("#password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/dashboard", { timeout: 15000 });
}

async function logout(page) {
  await page.locator("header button.rounded-full").last().click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await page.waitForURL("**/login", { timeout: 10000 });
}

async function visitRoute(page, path) {
  const errors = [];
  const res = await page.goto(`${BASE}${path}`, { waitUntil: "networkidle", timeout: 20000 });
  await page.waitForTimeout(400);
  const body = await page.locator("body").innerText();
  const hasAccessDenied =
    body.includes("Access restricted") || body.includes("Access denied");
  const hasCrash =
    body.includes("Application error") ||
    body.includes("Unhandled Runtime Error") ||
    body.includes("Something went wrong");
  const hasNaN = /\bNaN\b/.test(body) || /\bInfinity\b/.test(body);
  const status = res?.status() ?? 0;
  return { status, hasAccessDenied, hasCrash, hasNaN, ok: status === 200 && !hasCrash };
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      const t = msg.text();
      if (!t.includes("favicon") && !t.includes("404") && !t.includes("hydration")) {
        criticalConsole.push(t);
      }
    }
  });
  page.on("pageerror", (err) => criticalConsole.push(err.message));

  // LOGIN QA
  await clearStorage(page);
  await page.goto(`${BASE}/login`);
  record("LOGIN", "Login page renders", (await page.title()).length > 0);

  await clickPortal(page, ACCOUNTS.admin.portal);
  await page.locator("#email").fill("");
  await page.locator("#password").fill("");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForTimeout(500);
  const validationVisible = await page.getByText("Password is required").isVisible().catch(() => false);
  record("LOGIN", "Empty credentials show validation", validationVisible);

  await page.locator("#email").fill("invalid@shinystone.com");
  await page.locator("#password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForTimeout(800);
  const invalidMsg = await page.locator("body").innerText();
  record("LOGIN", "Invalid email rejected", invalidMsg.includes("Invalid email or password"));

  await page.getByRole("button", { name: "Change portal" }).click();
  await clickPortal(page, ACCOUNTS.salesperson.portal);
  await page.locator("#email").fill(ACCOUNTS.admin.email);
  await page.locator("#password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForTimeout(800);
  const wrongPortal = await page.locator("body").innerText();
  record("LOGIN", "Wrong portal rejected", wrongPortal.includes("cannot sign in"));

  for (const [key, account] of Object.entries(ACCOUNTS)) {
    await login(page, account);
    const dash = await page.locator("body").innerText();
    const onDashboard = page.url().includes("/dashboard");
    const hasContent =
      dash.includes("Dashboard") ||
      dash.includes("My Dashboard") ||
      dash.includes("Good morning") ||
      dash.includes("Team") ||
      dash.includes("Sales");
    record("LOGIN", `${key} login + dashboard`, onDashboard && hasContent);
    await logout(page);
    const onLogin = page.url().includes("/login");
    record("LOGIN", `${key} logout resets session`, onLogin);
  }

  // ADMIN routes
  await login(page, ACCOUNTS.admin);
  const adminRoutes = [
    "/dashboard", "/customers", "/contacts", "/deals", "/pipeline", "/inbox",
    "/purchase-orders", "/follow-ups", "/audit-logs", "/permissions",
    "/organization-settings", "/targets", "/notifications", "/search",
    "/data-management", "/email-integrations", "/automation", "/ai",
    "/data-management/documents", "/system-health", "/backup-recovery", "/settings", "/users",
  ];
  for (const route of adminRoutes) {
    const v = await visitRoute(page, route);
    record("ADMIN", `Route ${route}`, v.ok && !v.hasNaN, `status=${v.status}`);
  }
  await logout(page);

  // MANAGER A
  await login(page, ACCOUNTS.managerA);
  const managerRoutes = [
    "/dashboard", "/my-team", "/customers", "/contacts", "/deals", "/pipeline", "/inbox",
    "/purchase-orders", "/follow-ups", "/notifications", "/search", "/reports",
    "/targets", "/automation", "/settings",
  ];
  for (const route of managerRoutes) {
    const v = await visitRoute(page, route);
    record("MANAGER A", `Route ${route}`, v.ok && !v.hasNaN);
  }
  const teamBBlocked = await visitRoute(page, "/customers/cust-8");
  record("CROSS-ROLE SECURITY", "Manager A blocked Team B customer cust-8", teamBBlocked.hasAccessDenied);
  const teamBDeal = await visitRoute(page, "/deals/deal-13");
  record("CROSS-ROLE SECURITY", "Manager A blocked Team B deal deal-13", teamBDeal.hasAccessDenied);
  const teamBPO = await visitRoute(page, "/purchase-orders/po-8");
  record("CROSS-ROLE SECURITY", "Manager A blocked Team B PO po-8", teamBPO.hasAccessDenied);
  const teamBMember = await visitRoute(page, "/my-team/user-7");
  record("CROSS-ROLE SECURITY", "Manager A blocked Team B member user-7", teamBMember.hasAccessDenied);
  const adminBlockMgr = await visitRoute(page, "/permissions");
  record("CROSS-ROLE SECURITY", "Manager A blocked /permissions", adminBlockMgr.hasAccessDenied);
  await logout(page);

  // MANAGER B
  await login(page, ACCOUNTS.managerB);
  for (const route of managerRoutes) {
    const v = await visitRoute(page, route);
    record("MANAGER B", `Route ${route}`, v.ok && !v.hasNaN);
  }
  const teamACustomer = await visitRoute(page, "/customers/cust-6");
  record("CROSS-ROLE SECURITY", "Manager B blocked Team A customer cust-6", teamACustomer.hasAccessDenied);
  const teamADeal = await visitRoute(page, "/deals/deal-9");
  record("CROSS-ROLE SECURITY", "Manager B blocked Team A deal deal-9", teamADeal.hasAccessDenied);
  await logout(page);

  // SALESPERSON
  await login(page, ACCOUNTS.salesperson);
  const spRoutes = [
    "/dashboard", "/my-performance", "/customers", "/contacts", "/deals", "/pipeline",
    "/inbox", "/purchase-orders", "/follow-ups", "/notifications", "/search",
    "/reports", "/targets", "/automation", "/settings",
  ];
  for (const route of spRoutes) {
    const v = await visitRoute(page, route);
    record("SALESPERSON", `Route ${route}`, v.ok && !v.hasNaN, `status=${v.status}`);
  }
  const sarahCustomer = await visitRoute(page, "/customers/cust-7");
  record("CROSS-ROLE SECURITY", "John blocked Sarah customer cust-7", sarahCustomer.hasAccessDenied);
  const sarahDeal = await visitRoute(page, "/deals/deal-11");
  record("CROSS-ROLE SECURITY", "John blocked Sarah deal deal-11", sarahDeal.hasAccessDenied);
  const sarahPO = await visitRoute(page, "/purchase-orders/po-7");
  record("CROSS-ROLE SECURITY", "John blocked Sarah PO po-7", sarahPO.hasAccessDenied);
  const spAdminBlock = await visitRoute(page, "/audit-logs");
  record("CROSS-ROLE SECURITY", "Salesperson blocked /audit-logs", spAdminBlock.hasAccessDenied);
  const spMyTeam = await visitRoute(page, "/my-team");
  record("CROSS-ROLE SECURITY", "Salesperson blocked /my-team", spMyTeam.hasAccessDenied);

  await page.goto(`${BASE}/search?q=Pacific`);
  await page.waitForTimeout(600);
  const searchBody = await page.locator("body").innerText();
  record("CROSS-ROLE SECURITY", "John search no Pacific Foods", !searchBody.includes("Pacific Foods"));

  // INTERACTIONS
  await page.goto(`${BASE}/dashboard`);
  const menuBtn = page.locator('button[aria-label="Open menu"], button').filter({ hasText: "" }).first();
  if (await page.viewportSize()?.width < 1024) {
    const mobileMenu = page.getByRole("button").filter({ has: page.locator("svg") });
    record("INTERACTIONS", "Mobile viewport has nav trigger", (await mobileMenu.count()) > 0);
  }
  record("INTERACTIONS", "Dashboard KPIs visible", (await page.locator("body").innerText()).includes("Sales") || (await page.locator("body").innerText()).includes("Pipeline"));

  // RESPONSIVE — sample key pages at each viewport
  for (const vp of VIEWPORTS) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    for (const route of ["/login", "/dashboard", "/customers", "/deals", "/pipeline"]) {
      const v = await visitRoute(page, route);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
      record("RESPONSIVE", `${vp.name}px ${route}`, v.ok && !overflow, overflow ? "horizontal overflow" : "");
    }
  }

  await browser.close();

  const failed = results.filter((r) => !r.pass);
  const passed = results.filter((r) => r.pass).length;
  console.log("\n=== FRONTEND FREEZE QA ===");
  console.log(`TOTAL: ${results.length} | PASS: ${passed} | FAIL: ${failed.length}`);
  if (failed.length) {
    console.log("\n--- FAILURES ---");
    for (const f of failed) console.log(`[${f.section}] ${f.name}${f.detail ? ` — ${f.detail}` : ""}`);
  }
  if (criticalConsole.length) {
    console.log("\n--- CONSOLE ERRORS (sample) ---");
    criticalConsole.slice(0, 10).forEach((e) => console.log(e));
  }
  record("BROWSER CONSOLE", "No critical uncaught errors", criticalConsole.length === 0, `${criticalConsole.length} errors`);
  results.push({
    section: "BROWSER CONSOLE",
    name: "Critical console check",
    pass: criticalConsole.length === 0,
    detail: String(criticalConsole.length),
  });

  process.exit(failed.length ? 1 : 0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
