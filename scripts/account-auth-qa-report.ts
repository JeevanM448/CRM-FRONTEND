/**
 * Account authentication QA harness.
 * Run: npx tsx scripts/account-auth-qa-report.ts
 */
import { createSeedState } from "../src/data/mock/seed";
import { DEMO_ACCOUNT_PASSWORD } from "../src/types/account";
import { applyScope, getDataScope } from "../src/store/scope";
import {
  signIn,
  signOut,
  isEmailAvailable,
  changePassword,
  requestPasswordReset,
} from "../src/services/mock/authService";
import * as store from "../src/store/crmStore";

type Result = "PASS" | "FAIL";

interface Case {
  area: string;
  name: string;
  result: Result;
  detail?: string;
}

const results: Case[] = [];
const MAYA = "user-9";
const PRIYA = "user-3";
const JOHN = "user-5";

function record(area: string, name: string, ok: boolean, detail?: string) {
  results.push({ area, name, result: ok ? "PASS" : "FAIL", detail });
}

async function run() {
  store.initStore();

  // --- AUTH LOGIN ---
  try {
    await signIn("invalid@shinystone.com", DEMO_ACCOUNT_PASSWORD, "admin");
    record("AUTH", "Invalid email rejected", false);
  } catch {
    record("AUTH", "Invalid email rejected", true);
  }

  try {
    await signIn("jeevan.elias@shinystone.com", "", "admin");
    record("AUTH", "Empty password rejected", false);
  } catch {
    record("AUTH", "Empty password rejected", true);
  }

  try {
    await signIn("john.smith@shinystone.com", "wrong-password", "salesperson");
    record("AUTH", "Wrong password rejected", false);
  } catch {
    record("AUTH", "Wrong password rejected", true);
  }

  try {
    await signIn("john.smith@shinystone.com", DEMO_ACCOUNT_PASSWORD, "sales_manager");
    record("AUTH", "Salesperson cannot use Manager portal", false);
  } catch {
    record("AUTH", "Salesperson cannot use Manager portal", true);
  }

  try {
    await signIn("maya.fernandez@shinystone.com", DEMO_ACCOUNT_PASSWORD, "salesperson");
    record("AUTH", "Manager cannot use Salesperson portal", false);
  } catch {
    record("AUTH", "Manager cannot use Salesperson portal", true);
  }

  const adminSession = await signIn("jeevan.elias@shinystone.com", DEMO_ACCOUNT_PASSWORD, "admin");
  record("AUTH", "Admin valid login", adminSession.role === "admin");
  record("AUTH", "Admin session has organizationId", Boolean(adminSession.organizationId));
  await signOut();
  record("AUTH", "Logout clears session", store.getCurrentUser() === undefined);

  const mayaSession = await signIn("maya.fernandez@shinystone.com", DEMO_ACCOUNT_PASSWORD, "sales_manager");
  record("AUTH", "Manager A valid login", mayaSession.userId === MAYA && mayaSession.role === "sales_manager");
  await signOut();

  const priyaSession = await signIn("priya.nair@shinystone.com", DEMO_ACCOUNT_PASSWORD, "sales_manager");
  record("AUTH", "Manager B valid login", priyaSession.userId === PRIYA);
  await signOut();

  const johnUpper = await signIn("JOHN.SMITH@SHINYSTONE.COM", DEMO_ACCOUNT_PASSWORD, "salesperson");
  record("AUTH", "Uppercase email normalization", johnUpper.userId === JOHN);
  await signOut();

  const johnTrim = await signIn("  john.smith@shinystone.com  ", DEMO_ACCOUNT_PASSWORD, "salesperson");
  record("AUTH", "Whitespace email normalization", johnTrim.userId === JOHN);
  await signOut();

  const roleSession = await signIn("john.smith@shinystone.com", DEMO_ACCOUNT_PASSWORD, "salesperson");
  record("AUTH", "Role comes from stored account", roleSession.role === "salesperson");
  await signOut();

  // --- DISABLED ACCOUNT ---
  store.setCurrentUser("user-1");
  store.deactivateUser(JOHN);
  store.clearCurrentUser();
  try {
    await signIn("john.smith@shinystone.com", DEMO_ACCOUNT_PASSWORD, "salesperson");
    record("AUTH", "Disabled employee cannot login", false);
  } catch {
    record("AUTH", "Disabled employee cannot login", true);
  }
  store.setCurrentUser("user-1");
  store.updateUser(JOHN, { status: "active" });
  store.clearCurrentUser();
  const reactivated = await signIn("john.smith@shinystone.com", DEMO_ACCOUNT_PASSWORD, "salesperson");
  record("AUTH", "Reactivated employee can login", reactivated.userId === JOHN);
  await signOut();

  // --- EMAIL UNIQUENESS ---
  const available = await isEmailAvailable("new.manager@shinystone.com");
  const duplicate = await isEmailAvailable("jeevan.elias@shinystone.com");
  const normalizedDup = await isEmailAvailable("  Jeevan.Elias@shinystone.com  ");
  record("AUTH", "New email available", available);
  record("AUTH", "Existing admin email blocked", !duplicate);
  record("AUTH", "Normalized duplicate email blocked", !normalizedDup);

  // --- ADMIN ACCOUNT CREATION ---
  store.setCurrentUser("user-1");
  try {
    store.createUser({
      name: "Test Manager",
      email: "test.manager.profile@shinystone.com",
      role: "sales_manager",
      department: "Sales",
      team: "Team A",
      status: "active",
      signInEmail: "test.manager@shinystone.com",
      password: "Manager123",
      accountStatus: "active",
    });
    record("ADMIN CREATE", "Add Manager creates account", true);
  } catch (error) {
    record("ADMIN CREATE", "Add Manager creates account", false, String(error));
  }

  const createdManager = store.getUsers().find((u) => u.email === "test.manager.profile@shinystone.com");
  const managerAccount = createdManager
    ? store.getUserAccountForProfile(createdManager.id)
    : undefined;
  record("ADMIN CREATE", "Manager account linked to employee", managerAccount?.role === "sales_manager");

  try {
    store.createUser({
      name: "Dup Manager",
      email: "dup.manager.profile@shinystone.com",
      role: "sales_manager",
      department: "Sales",
      team: "Team A",
      status: "active",
      signInEmail: "test.manager@shinystone.com",
      password: "Manager123",
    });
    record("ADMIN CREATE", "Duplicate sign-in email rejected", false);
  } catch {
    record("ADMIN CREATE", "Duplicate sign-in email rejected", true);
  }

  try {
    store.setCurrentUser("user-1");
    await changePassword(JOHN, DEMO_ACCOUNT_PASSWORD, "short", "short");
    record("ADMIN CREATE", "Weak password rejected", false);
  } catch {
    record("ADMIN CREATE", "Weak password rejected", true);
  }

  try {
    await changePassword(JOHN, DEMO_ACCOUNT_PASSWORD, "newpass", "mismatch");
    record("ADMIN CREATE", "Password confirmation mismatch rejected", false);
  } catch {
    record("ADMIN CREATE", "Password confirmation mismatch rejected", true);
  }

  try {
    await changePassword(JOHN, "wrong-current", "Newpass123", "Newpass123");
    record("AUTH", "Incorrect current password rejected", false);
  } catch {
    record("AUTH", "Incorrect current password rejected", true);
  }

  store.setCurrentUser("user-1");
  await changePassword(JOHN, DEMO_ACCOUNT_PASSWORD, "Newpass123", "Newpass123");
  const johnAfterChange = await signIn("john.smith@shinystone.com", "Newpass123", "salesperson");
  record("AUTH", "Password change allows new login", johnAfterChange.userId === JOHN);
  await signOut();
  store.setCurrentUser("user-1");
  store.changeUserAccountPassword(JOHN, DEMO_ACCOUNT_PASSWORD);

  await requestPasswordReset("john.smith@shinystone.com");
  record("AUTH", "Forgot password request recorded", true);

  // --- SCOPE ---
  const seed = createSeedState();
  const mayaScope = getDataScope(seed, MAYA);
  const priyaScope = getDataScope(seed, PRIYA);
  const johnScope = getDataScope(seed, JOHN);
  const adminScope = getDataScope(seed, "user-1");

  record("SCOPE", "Manager A team scope", mayaScope.type === "team" && mayaScope.ownerIds.length > 1);
  record("SCOPE", "Manager B team scope", priyaScope.type === "team" && priyaScope.ownerIds.length > 1);
  record("SCOPE", "Salesperson limited to self", johnScope.type === "self" && johnScope.ownerIds.includes(JOHN));
  record("SCOPE", "Admin organization-wide", adminScope.type === "organization" && adminScope.unrestricted);

  const mayaCustomers = applyScope(seed, mayaScope).customers;
  const priyaCustomers = applyScope(seed, priyaScope).customers;
  record(
    "SCOPE",
    "Manager A vs B customer sets differ",
    mayaCustomers.length > 0 && priyaCustomers.length > 0 && mayaCustomers[0]?.id !== priyaCustomers[0]?.id
  );

  // --- REPORT ---
  const failed = results.filter((item) => item.result === "FAIL");
  console.log("\n=== ACCOUNT AUTH QA REPORT ===\n");
  for (const item of results) {
    console.log(`${item.result} | ${item.area} | ${item.name}${item.detail ? ` — ${item.detail}` : ""}`);
  }
  console.log(`\nTotal: ${results.length} | Passed: ${results.length - failed.length} | Failed: ${failed.length}`);
  if (failed.length > 0) process.exit(1);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
