import type { CreateAuditLogInput } from "./auditLogs";
import type { AuditValue, CRMState } from "./types";
import {
  buildExportRows,
  previewImport,
  type ExportEntityType,
  type ImportEntityType,
  type ImportPreviewResult,
} from "@/lib/data-management/import";
import { toCsv } from "@/lib/data-management/csv";
import { EXPORT_HEADERS } from "@/lib/data-management/import";
import { generateId } from "./storage";
import { getUserById } from "./helpers";
import type { DealStage, EntityStatus } from "@/types";

export type DataManagementStoreApi = {
  getState: () => CRMState;
  setState: (updater: (prev: CRMState) => CRMState) => void;
  withAuditEntries: (s: CRMState, entries: CreateAuditLogInput[]) => CRMState;
  requireDataExport: () => void;
  requireDataImport: () => void;
  getWorkingState: () => CRMState;
};

export function createDataManagementStore(api: DataManagementStoreApi) {
  function previewDataImport(entityType: ImportEntityType, rows: Array<Record<string, string>>) {
    api.requireDataImport();
    return previewImport(entityType, api.getState(), rows);
  }

  function exportEntityCsv(entityType: ExportEntityType) {
    api.requireDataExport();
    const scoped = api.getWorkingState();
    const headers = EXPORT_HEADERS[entityType];
    const rows = buildExportRows(entityType, scoped);
    const csv = toCsv(headers, rows);
    api.setState((s) =>
      api.withAuditEntries(s, [
        {
          action: "exported",
          entityType: mapExportEntity(entityType),
          entityId: `export:${entityType}`,
          metadata: { count: rows.length, format: "csv" },
        },
      ])
    );
    return { filename: `${entityType}-${new Date().toISOString().slice(0, 10)}.csv`, csv };
  }

  function confirmDataImport(preview: ImportPreviewResult) {
    api.requireDataImport();
    const state = api.getState();
    const applicable = preview.rows.filter((row) => row.action === "create" || row.action === "update");
    if (applicable.length === 0) {
      throw new Error("No valid rows to import");
    }

    let nextState: CRMState = { ...state };
    applicable.forEach((row) => {
      nextState = applyImportRow(nextState, preview.entityType, row);
    });

    api.setState((s) =>
      api.withAuditEntries(
        {
          ...nextState,
          currentUserId: s.currentUserId,
          settings: s.settings,
          rolePermissions: s.rolePermissions,
          organization: s.organization,
        },
        [
          {
            action: "imported",
            entityType: mapImportEntity(preview.entityType),
            entityId: `import:${preview.entityType}`,
            metadata: {
              created: preview.summary.create,
              updated: preview.summary.update,
              skipped: preview.summary.skip,
              errors: preview.summary.error,
            } as AuditValue,
          },
        ]
      )
    );

    return preview.summary;
  }

  return {
    previewDataImport,
    exportEntityCsv,
    confirmDataImport,
  };
}

function mapImportEntity(entityType: ImportEntityType) {
  if (entityType === "customers") return "customer";
  if (entityType === "contacts") return "contact";
  if (entityType === "employees") return "user";
  return "deal";
}

function mapExportEntity(entityType: ExportEntityType) {
  if (entityType === "customers") return "customer";
  if (entityType === "contacts") return "contact";
  if (entityType === "deals") return "deal";
  if (entityType === "purchaseOrders") return "purchase_order";
  if (entityType === "followUps") return "follow_up";
  if (entityType === "employees") return "user";
  if (entityType === "salesTargets") return "sales_target";
  return "system";
}

function applyImportRow(
  state: CRMState,
  entityType: ImportEntityType,
  row: ImportPreviewResult["rows"][number]
): CRMState {
  const data = row.data;
  if (entityType === "customers") {
    const existing = state.customers.find(
      (item) => item.name.toLowerCase() === data.name.trim().toLowerCase()
    );
    if (existing) {
      return {
        ...state,
        customers: state.customers.map((item) =>
          item.id === existing.id
            ? {
                ...item,
                industry: data.industry?.trim() || item.industry,
                location: data.location?.trim() || item.location,
                contactName: data.contactName?.trim() || item.contactName,
                contactEmail: data.contactEmail?.trim() || item.contactEmail,
                contactPhone: data.contactPhone?.trim() || item.contactPhone,
                status: (data.status as EntityStatus) || item.status,
              }
            : item
        ),
      };
    }
    const owner = state.users.find((user) => user.role === "admin") ?? state.users[0];
    const customer = {
      id: generateId("cust"),
      name: data.name.trim(),
      industry: data.industry?.trim() || "General",
      location: data.location?.trim() || "—",
      contactName: data.contactName?.trim() || "—",
      contactEmail: data.contactEmail?.trim() || "",
      contactPhone: data.contactPhone?.trim() || "",
      ownerId: owner?.id ?? state.currentUserId,
      owner: owner?.name ?? "Unassigned",
      status: (data.status as EntityStatus) || "active",
      activeDeals: 0,
      revenue: 0,
      lastActivity: new Date().toISOString(),
    };
    return { ...state, customers: [...state.customers, customer] };
  }

  if (entityType === "contacts") {
    const existing = state.contacts.find(
      (item) => item.email.toLowerCase() === data.email.trim().toLowerCase()
    );
    const company = state.customers.find(
      (item) => item.name.toLowerCase() === data.company.trim().toLowerCase()
    );
    const owner = state.users.find((user) => user.role === "admin") ?? state.users[0];
    if (existing) {
      return {
        ...state,
        contacts: state.contacts.map((item) =>
          item.id === existing.id
            ? {
                ...item,
                name: data.name.trim(),
                company: data.company.trim(),
                designation: data.designation?.trim() || item.designation,
                phone: data.phone?.trim() || item.phone,
                status: (data.status as EntityStatus) || item.status,
              }
            : item
        ),
      };
    }
    const contact = {
      id: generateId("contact"),
      name: data.name.trim(),
      company: data.company.trim(),
      companyId: company?.id ?? "",
      designation: data.designation?.trim() || "—",
      email: data.email.trim(),
      phone: data.phone?.trim() || "",
      ownerId: owner?.id ?? state.currentUserId,
      owner: owner?.name ?? "Unassigned",
      lastContact: new Date().toISOString(),
      status: (data.status as EntityStatus) || "active",
    };
    return { ...state, contacts: [...state.contacts, contact] };
  }

  if (entityType === "employees") {
    const existing = state.users.find(
      (item) => item.email.toLowerCase() === data.email.trim().toLowerCase()
    );
    const manager = data.managerEmail
      ? state.users.find(
          (item) => item.email.toLowerCase() === data.managerEmail.trim().toLowerCase()
        )
      : undefined;
    if (existing) {
      return {
        ...state,
        users: state.users.map((item) =>
          item.id === existing.id
            ? {
                ...item,
                name: data.name.trim(),
                phone: data.phone?.trim() || item.phone,
                team: data.team?.trim() || item.team,
                managerId: manager?.id ?? item.managerId,
                status: (data.status as EntityStatus) || item.status,
              }
            : item
        ),
      };
    }
    const user = {
      id: generateId("user"),
      name: data.name.trim(),
      email: data.email.trim(),
      role: (data.role?.trim() || "salesperson") as CRMState["users"][number]["role"],
      department: "Sales",
      team: data.team?.trim() || manager?.team,
      managerId: manager?.id,
      phone: data.phone?.trim(),
      status: (data.status as EntityStatus) || "active",
      lastActive: new Date().toISOString(),
    };
    return { ...state, users: [...state.users, user] };
  }

  const existingDeal = state.deals.find(
    (item) => item.title.toLowerCase() === data.title.trim().toLowerCase()
  );
  const customer = state.customers.find(
    (item) => item.name.toLowerCase() === data.customerName.trim().toLowerCase()
  );
  const owner = data.ownerEmail
    ? state.users.find((item) => item.email.toLowerCase() === data.ownerEmail.trim().toLowerCase())
    : state.users.find((user) => user.role === "admin");
  if (existingDeal) {
    return {
      ...state,
      deals: state.deals.map((item) =>
        item.id === existingDeal.id
          ? {
              ...item,
              value: Number(data.value),
              stage: (data.stage as DealStage) || item.stage,
              owner: owner?.name ?? item.owner,
              ownerId: owner?.id ?? item.ownerId,
              probability: Number(data.probability) || item.probability,
              expectedClose: data.expectedClose || item.expectedClose,
            }
          : item
      ),
    };
  }
  const deal = {
    id: generateId("deal"),
    title: data.title.trim(),
    customerId: customer?.id ?? "",
    customerName: data.customerName.trim(),
    value: Number(data.value),
    stage: (data.stage as DealStage) || "new",
    owner: owner?.name ?? "Unassigned",
    ownerId: owner?.id ?? state.currentUserId,
    probability: Number(data.probability) || 20,
    expectedClose: data.expectedClose || new Date().toISOString().slice(0, 10),
    lastActivity: new Date().toISOString(),
    priority: "medium" as const,
    emailCount: 0,
  };
  return { ...state, deals: [...state.deals, deal] };
}
