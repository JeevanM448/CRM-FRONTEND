import type { User } from "@/types";
import type { UserAccount } from "@/types/account";
import { DEFAULT_ORGANIZATION_ID, DEMO_ACCOUNT_PASSWORD } from "@/types/account";
import {
  createUserAccountRecord,
  isAccountRole,
  mapUserStatusToAccountStatus,
} from "@/store/accounts";
import type { CRMState } from "@/store/types";

/**
 * Seeds mock sign-in accounts for development/demo users.
 * Password for all seeded accounts: DEMO_ACCOUNT_PASSWORD ("demo").
 */
export function createSeedAccounts(users: User[]): UserAccount[] {
  const baseState: CRMState = {
    customers: [],
    contacts: [],
    deals: [],
    emails: [],
    purchaseOrders: [],
    followUps: [],
    workflows: [],
    automationExecutions: [],
    aiConfiguration: {} as CRMState["aiConfiguration"],
    aiCapabilities: [],
    aiExecutions: [],
    documents: [],
    documentVersions: [],
    documentProcessing: [],
    healthServices: [],
    healthCheckHistory: [],
    systemIncidents: [],
    backups: [],
    recoveryPoints: [],
    backupRetentionPolicy: {} as CRMState["backupRetentionPolicy"],
    users,
    userAccounts: [],
    notifications: [],
    activities: [],
    salesTargets: [],
    targetHistory: [],
    teamRequests: [],
    auditLogs: [],
    emailIntegrations: [],
    emailSyncRuns: [],
    rolePermissions: {} as CRMState["rolePermissions"],
    organization: {} as CRMState["organization"],
    settings: {} as CRMState["settings"],
    currentUserId: "",
  };

  const accounts: UserAccount[] = [];
  for (const user of users) {
    if (!isAccountRole(user.role)) continue;
    const account = createUserAccountRecord(baseState, {
      userId: user.id,
      email: user.email,
      password: DEMO_ACCOUNT_PASSWORD,
      role: user.role,
      status: mapUserStatusToAccountStatus(user.status),
      organizationId: DEFAULT_ORGANIZATION_ID,
    });
    accounts.push(account);
    baseState.userAccounts = accounts;
  }
  return accounts;
}
