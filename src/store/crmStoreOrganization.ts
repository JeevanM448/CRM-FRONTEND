import type { DealStage, POStatus } from "@/types";
import type { CreateAuditLogInput } from "./auditLogs";
import type { AuditValue, CRMState } from "./types";
import type {
  BusinessRules,
  OrganizationSettings,
  OrganizationState,
  OrganizationTeam,
  PipelineStageConfig,
  POStatusConfig,
  SalesRegion,
} from "./organization";
import {
  countUsersOnTeam,
  getActivePipelineStages,
  getStageLabelMap,
} from "./organization";
import { generateId } from "./storage";

export type OrganizationStoreApi = {
  getState: () => CRMState;
  setState: (updater: (prev: CRMState) => CRMState) => void;
  withAuditEntries: (s: CRMState, entries: CreateAuditLogInput[]) => CRMState;
  requireSettingsManage: () => void;
};

function syncLegacySettings(settings: OrganizationSettings) {
  return {
    companyName: settings.companyName,
    defaultCurrency: settings.currency,
    timezone: settings.timezone,
  };
}

export function createOrganizationStore(api: OrganizationStoreApi) {
  function getOrganization(): OrganizationState {
    return api.getState().organization;
  }

  function updateOrganizationProfile(data: Partial<OrganizationSettings>) {
    api.requireSettingsManage();
    const previous = api.getState().organization.settings;
    const next: OrganizationSettings = {
      ...previous,
      ...data,
      companyName: data.companyName?.trim() ?? previous.companyName,
      legalName: data.legalName?.trim() ?? previous.legalName,
      email: data.email?.trim() ?? previous.email,
      phone: data.phone?.trim() ?? previous.phone,
      website: data.website?.trim() ?? previous.website,
      address: data.address?.trim() ?? previous.address,
      city: data.city?.trim() ?? previous.city,
      state: data.state?.trim() ?? previous.state,
      country: data.country?.trim() ?? previous.country,
      postalCode: data.postalCode?.trim() ?? previous.postalCode,
    };
    api.setState((s) =>
      api.withAuditEntries(
        {
          ...s,
          organization: { ...s.organization, settings: next },
          settings: { ...s.settings, ...syncLegacySettings(next) },
        },
        [
          {
            action: "updated",
            entityType: "organization",
            entityId: next.id,
            previousValue: { section: "profile", ...previous },
            newValue: { section: "profile", ...next },
          },
        ]
      )
    );
    return next;
  }

  function updateRegionalSettings(
    data: Pick<
      OrganizationSettings,
      "currency" | "timezone" | "dateFormat" | "fiscalYearStartMonth" | "defaultLanguage"
    >
  ) {
    api.requireSettingsManage();
    const previous = api.getState().organization.settings;
    const next = { ...previous, ...data };
    api.setState((s) =>
      api.withAuditEntries(
        {
          ...s,
          organization: { ...s.organization, settings: next },
          settings: { ...s.settings, ...syncLegacySettings(next) },
        },
        [
          {
            action: "updated",
            entityType: "organization",
            entityId: next.id,
            previousValue: {
              currency: previous.currency,
              timezone: previous.timezone,
              dateFormat: previous.dateFormat,
              fiscalYearStartMonth: previous.fiscalYearStartMonth,
              defaultLanguage: previous.defaultLanguage,
            },
            newValue: {
              currency: next.currency,
              timezone: next.timezone,
              dateFormat: next.dateFormat,
              fiscalYearStartMonth: next.fiscalYearStartMonth,
              defaultLanguage: next.defaultLanguage,
            },
            metadata: { section: "regional" },
          },
        ]
      )
    );
    return next;
  }

  function updateBusinessRules(data: Partial<BusinessRules>) {
    api.requireSettingsManage();
    const previous = api.getState().organization.businessRules;
    const next = { ...previous, ...data };
    api.setState((s) =>
      api.withAuditEntries(
        {
          ...s,
          organization: { ...s.organization, businessRules: next },
        },
        [
          {
            action: "updated",
            entityType: "organization",
            entityId: s.organization.settings.id,
            previousValue: previous as unknown as AuditValue,
            newValue: next as unknown as AuditValue,
            metadata: { section: "business_rules" },
          },
        ]
      )
    );
    return next;
  }

  function createOrganizationTeam(input: { name: string; code: string }) {
    api.requireSettingsManage();
    const name = input.name.trim();
    const code = input.code.trim().toUpperCase();
    if (!name) throw new Error("Team name is required");
    if (!code) throw new Error("Team code is required");
    if (api.getState().organization.teams.some((team) => team.name.toLowerCase() === name.toLowerCase())) {
      throw new Error("A team with this name already exists");
    }
    const now = new Date().toISOString();
    const team: OrganizationTeam = {
      id: generateId("org-team"),
      name,
      code,
      status: "active",
      createdAt: now,
      updatedAt: now,
    };
    api.setState((s) =>
      api.withAuditEntries(
        {
          ...s,
          organization: { ...s.organization, teams: [...s.organization.teams, team] },
        },
        [
          {
            action: "created",
            entityType: "team",
            entityId: team.id,
            newValue: team as unknown as AuditValue,
          },
        ]
      )
    );
    return team;
  }

  function renameOrganizationTeam(id: string, name: string, code?: string) {
    api.requireSettingsManage();
    const existing = api.getState().organization.teams.find((team) => team.id === id);
    if (!existing) throw new Error("Team not found");
    const nextName = name.trim();
    const nextCode = (code ?? existing.code).trim().toUpperCase();
    if (!nextName) throw new Error("Team name is required");
    const oldName = existing.name;
    const updated: OrganizationTeam = {
      ...existing,
      name: nextName,
      code: nextCode,
      updatedAt: new Date().toISOString(),
    };
    api.setState((s) =>
      api.withAuditEntries(
        {
          ...s,
          users: s.users.map((user) =>
            user.team === oldName ? { ...user, team: nextName } : user
          ),
          organization: {
            ...s.organization,
            teams: s.organization.teams.map((team) => (team.id === id ? updated : team)),
          },
        },
        [
          {
            action: "updated",
            entityType: "team",
            entityId: id,
            previousValue: { name: existing.name, code: existing.code },
            newValue: { name: updated.name, code: updated.code },
          },
        ]
      )
    );
    return updated;
  }

  function setOrganizationTeamStatus(id: string, status: "active" | "inactive") {
    api.requireSettingsManage();
    const existing = api.getState().organization.teams.find((team) => team.id === id);
    if (!existing) throw new Error("Team not found");
    const updated: OrganizationTeam = {
      ...existing,
      status,
      updatedAt: new Date().toISOString(),
    };
    api.setState((s) =>
      api.withAuditEntries(
        {
          ...s,
          organization: {
            ...s.organization,
            teams: s.organization.teams.map((team) => (team.id === id ? updated : team)),
          },
        },
        [
          {
            action: status === "active" ? "activated" : "deactivated",
            entityType: "team",
            entityId: id,
            previousValue: { status: existing.status },
            newValue: { status },
            metadata: { name: existing.name },
          },
        ]
      )
    );
    return updated;
  }

  function createSalesRegion(input: { name: string; code: string }) {
    api.requireSettingsManage();
    const name = input.name.trim();
    const code = input.code.trim().toUpperCase();
    if (!name) throw new Error("Region name is required");
    if (!code) throw new Error("Region code is required");
    const now = new Date().toISOString();
    const region: SalesRegion = {
      id: generateId("region"),
      name,
      code,
      status: "active",
      createdAt: now,
      updatedAt: now,
    };
    api.setState((s) =>
      api.withAuditEntries(
        {
          ...s,
          organization: { ...s.organization, regions: [...s.organization.regions, region] },
        },
        [{ action: "created", entityType: "region", entityId: region.id, newValue: region as unknown as AuditValue }]
      )
    );
    return region;
  }

  function renameSalesRegion(id: string, name: string, code?: string) {
    api.requireSettingsManage();
    const existing = api.getState().organization.regions.find((region) => region.id === id);
    if (!existing) throw new Error("Region not found");
    const updated: SalesRegion = {
      ...existing,
      name: name.trim(),
      code: (code ?? existing.code).trim().toUpperCase(),
      updatedAt: new Date().toISOString(),
    };
    api.setState((s) =>
      api.withAuditEntries(
        {
          ...s,
          organization: {
            ...s.organization,
            regions: s.organization.regions.map((region) => (region.id === id ? updated : region)),
          },
        },
        [
          {
            action: "updated",
            entityType: "region",
            entityId: id,
            previousValue: { name: existing.name, code: existing.code },
            newValue: { name: updated.name, code: updated.code },
          },
        ]
      )
    );
    return updated;
  }

  function setSalesRegionStatus(id: string, status: "active" | "inactive") {
    api.requireSettingsManage();
    const existing = api.getState().organization.regions.find((region) => region.id === id);
    if (!existing) throw new Error("Region not found");
    const updated: SalesRegion = { ...existing, status, updatedAt: new Date().toISOString() };
    api.setState((s) =>
      api.withAuditEntries(
        {
          ...s,
          organization: {
            ...s.organization,
            regions: s.organization.regions.map((region) => (region.id === id ? updated : region)),
          },
        },
        [
          {
            action: status === "active" ? "activated" : "deactivated",
            entityType: "region",
            entityId: id,
            previousValue: { status: existing.status },
            newValue: { status },
            metadata: { name: existing.name },
          },
        ]
      )
    );
    return updated;
  }

  function updatePipelineStage(
    id: DealStage,
    data: Partial<Pick<PipelineStageConfig, "label" | "status" | "order">>
  ) {
    api.requireSettingsManage();
    const existing = api.getState().organization.pipelineStages.find((stage) => stage.id === id);
    if (!existing) throw new Error("Pipeline stage not found");
    const updated: PipelineStageConfig = { ...existing, ...data, id };
    api.setState((s) =>
      api.withAuditEntries(
        {
          ...s,
          organization: {
            ...s.organization,
            pipelineStages: s.organization.pipelineStages.map((stage) =>
              stage.id === id ? updated : stage
            ),
          },
        },
        [
          {
            action: "updated",
            entityType: "system",
            entityId: `pipeline-stage:${id}`,
            previousValue: existing as unknown as AuditValue,
            newValue: updated as unknown as AuditValue,
            metadata: { section: "pipeline" },
          },
        ]
      )
    );
    return updated;
  }

  function reorderPipelineStages(stageIdsInOrder: DealStage[]) {
    api.requireSettingsManage();
    const previous = api.getState().organization.pipelineStages;
    const next = previous.map((stage) => {
      const order = stageIdsInOrder.indexOf(stage.id);
      return { ...stage, order: order >= 0 ? order + 1 : stage.order };
    });
    api.setState((s) =>
      api.withAuditEntries(
        {
          ...s,
          organization: { ...s.organization, pipelineStages: next },
        },
        [
          {
            action: "updated",
            entityType: "system",
            entityId: "pipeline-stages",
            previousValue: { order: previous.map((stage) => stage.id) },
            newValue: { order: stageIdsInOrder },
            metadata: { section: "pipeline" },
          },
        ]
      )
    );
    return next;
  }

  function updatePOStatusConfig(
    id: POStatus,
    data: Partial<Pick<POStatusConfig, "label" | "status" | "order">>
  ) {
    api.requireSettingsManage();
    const existing = api.getState().organization.poStatuses.find((status) => status.id === id);
    if (!existing) throw new Error("PO status not found");
    const updated: POStatusConfig = { ...existing, ...data, id };
    api.setState((s) =>
      api.withAuditEntries(
        {
          ...s,
          organization: {
            ...s.organization,
            poStatuses: s.organization.poStatuses.map((status) =>
              status.id === id ? updated : status
            ),
          },
        },
        [
          {
            action: "updated",
            entityType: "system",
            entityId: `po-status:${id}`,
            previousValue: existing as unknown as AuditValue,
            newValue: updated as unknown as AuditValue,
            metadata: { section: "purchase_orders" },
          },
        ]
      )
    );
    return updated;
  }

  function getOrganizationTeams() {
    return api.getState().organization.teams;
  }

  function getActiveOrganizationTeams() {
    return api.getState().organization.teams.filter((team) => team.status === "active");
  }

  function getOrganizationTeamMemberCount(teamName: string) {
    return countUsersOnTeam(api.getState().users, teamName);
  }

  function getPipelineStageConfigs() {
    return api.getState().organization.pipelineStages;
  }

  function getActivePipelineStageConfigs() {
    return getActivePipelineStages(api.getState().organization.pipelineStages);
  }

  function getPipelineStageLabels() {
    return getStageLabelMap(api.getState().organization.pipelineStages);
  }

  function getPOStatusConfigs() {
    return api.getState().organization.poStatuses;
  }

  function assertActiveTeamName(teamName?: string) {
    if (!teamName) return;
    const team = api.getState().organization.teams.find((item) => item.name === teamName);
    if (!team || team.status !== "active") {
      throw new Error("Select an active team");
    }
  }

  return {
    getOrganization,
    updateOrganizationProfile,
    updateRegionalSettings,
    updateBusinessRules,
    createOrganizationTeam,
    renameOrganizationTeam,
    setOrganizationTeamStatus,
    createSalesRegion,
    renameSalesRegion,
    setSalesRegionStatus,
    updatePipelineStage,
    reorderPipelineStages,
    updatePOStatusConfig,
    getOrganizationTeams,
    getActiveOrganizationTeams,
    getOrganizationTeamMemberCount,
    getPipelineStageConfigs,
    getActivePipelineStageConfigs,
    getPipelineStageLabels,
    getPOStatusConfigs,
    assertActiveTeamName,
  };
}
