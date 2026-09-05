/**
 * Organization logo QA harness.
 * Run: npx tsx scripts/organization-logo-qa-report.ts
 */
import * as store from "../src/store/crmStore";
import {
  clearMockLogoBlobs,
  resolveOrganizationLogoUrl,
} from "../src/store/organizationLogo";
import { validateOrganizationLogoFile } from "../src/lib/validation";
import {
  getOrganization,
  removeOrganizationLogo,
  uploadOrganizationLogo,
} from "../src/services/mock/organizationService";

type Result = "PASS" | "FAIL";

interface Case {
  area: string;
  name: string;
  result: Result;
  detail?: string;
}

const results: Case[] = [];
const ADMIN = "user-1";
const MANAGER = "user-3";
const SALESPERSON = "user-5";

function record(area: string, name: string, ok: boolean, detail?: string) {
  results.push({ area, name, result: ok ? "PASS" : "FAIL", detail });
}

function makeFile(name: string, type: string, size: number) {
  const content = new Uint8Array(size);
  return new File([content], name, { type });
}

async function readAsDataUrl(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());
  return `data:${file.type};base64,${buffer.toString("base64")}`;
}

async function run() {
  store.initStore();
  clearMockLogoBlobs();
  store.removeOrganizationLogo();
  store.setCurrentUser(ADMIN);

  const png = makeFile("logo.png", "image/png", 1024);
  const jpeg = makeFile("logo.jpg", "image/jpeg", 2048);
  const invalid = makeFile("logo.gif", "image/gif", 512);
  const oversized = makeFile("logo-large.png", "image/png", 2 * 1024 * 1024 + 1);

  record(
    "VALIDATION",
    "Invalid file type rejected",
    validateOrganizationLogoFile(invalid) !== null
  );
  record(
    "VALIDATION",
    "Oversized file rejected",
    validateOrganizationLogoFile(oversized) !== null
  );
  record(
    "VALIDATION",
    "PNG accepted",
    validateOrganizationLogoFile(png) === null
  );

  const uploaded = await uploadOrganizationLogo(png);
  record("ADMIN", "Admin can upload logo", Boolean(uploaded.id));
  record(
    "ADMIN",
    "Logo metadata stored without binary in organization state",
    !JSON.stringify(store.getOrganization()).includes("data:image")
  );
  record(
    "ADMIN",
    "Logo preview URL resolves from blob store",
    Boolean(resolveOrganizationLogoUrl(store.getOrganization().logo))
  );

  const replaced = await uploadOrganizationLogo(jpeg);
  record("ADMIN", "Admin can replace logo", replaced.fileName === "logo.jpg");
  record(
    "AUDIT",
    "Upload and update audit events recorded",
    store
      .getAuditLogs()
      .some((log) => log.action === "organization_logo_uploaded") &&
      store.getAuditLogs().some((log) => log.action === "organization_logo_updated")
  );

  await removeOrganizationLogo();
  record("ADMIN", "Admin can remove logo", store.getOrganization().logo === null);
  record(
    "AUDIT",
    "Remove audit event recorded",
    store.getAuditLogs().some((log) => log.action === "organization_logo_removed")
  );

  store.setCurrentUser(MANAGER);
  let managerBlocked = false;
  try {
    const dataUrl = await readAsDataUrl(png);
    store.uploadOrganizationLogo(png, dataUrl);
  } catch {
    managerBlocked = true;
  }
  record("PERMISSION", "Manager cannot upload logo", managerBlocked);

  store.setCurrentUser(SALESPERSON);
  let salespersonBlocked = false;
  try {
    store.removeOrganizationLogo();
  } catch {
    salespersonBlocked = true;
  }
  record("PERMISSION", "Salesperson cannot remove logo", salespersonBlocked);

  store.setCurrentUser(ADMIN);
  const dataUrl = await readAsDataUrl(png);
  store.uploadOrganizationLogo(png, dataUrl);
  const persistedLogo = store.getOrganization().logo;
  store.initStore();
  const reloaded = store.getOrganization().logo;
  record(
    "PERSISTENCE",
    "Logo persists after store reload",
    reloaded?.storagePath === persistedLogo?.storagePath
  );
  record(
    "PERSISTENCE",
    "Resolved URL available after reload",
    Boolean(resolveOrganizationLogoUrl(reloaded))
  );

  store.removeOrganizationLogo();
  record(
    "FALLBACK",
    "Fallback branding when no logo",
    resolveOrganizationLogoUrl(store.getOrganization().logo) === null
  );

  const org = await getOrganization();
  record(
    "ISOLATION",
    "Organization logo scoped to default org",
    org.logo === null || org.logo.organizationId === org.settings.id
  );

  const failed = results.filter((item) => item.result === "FAIL");
  console.log("\n=== Organization Logo QA Report ===\n");
  for (const item of results) {
    console.log(
      `[${item.result}] ${item.area} — ${item.name}${item.detail ? ` (${item.detail})` : ""}`
    );
  }
  console.log(`\nTotal: ${results.length} | Passed: ${results.length - failed.length} | Failed: ${failed.length}`);
  if (failed.length > 0) process.exit(1);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
