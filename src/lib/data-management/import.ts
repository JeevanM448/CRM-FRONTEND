import type { CRMState } from "@/store/types";
import type { DealStage, EntityStatus, UserRole } from "@/types";
import { isValidEmail } from "@/lib/validation";
import type { CsvRow } from "./csv";

export type ImportEntityType =
  | "customers"
  | "contacts"
  | "employees"
  | "deals";

export type ImportRowAction = "create" | "update" | "skip" | "error";

export interface ImportRowIssue {
  row: number;
  field?: string;
  message: string;
}

export interface ImportRowPreview {
  row: number;
  action: ImportRowAction;
  data: CsvRow;
  issues: ImportRowIssue[];
}

export interface ImportPreviewResult {
  entityType: ImportEntityType;
  rows: ImportRowPreview[];
  summary: {
    create: number;
    update: number;
    skip: number;
    error: number;
  };
}

const DEAL_STAGES: DealStage[] = [
  "new",
  "qualified",
  "quotation",
  "negotiation",
  "won",
  "lost",
];

function rowNumber(index: number) {
  return index + 2;
}

export function previewCustomerImport(state: CRMState, rows: CsvRow[]): ImportPreviewResult {
  const previews: ImportRowPreview[] = rows.map((data, index) => {
    const issues: ImportRowIssue[] = [];
    const name = data.name?.trim();
    const email = data.contactEmail?.trim();
    if (!name) issues.push({ row: rowNumber(index), field: "name", message: "Name is required" });
    if (email && !isValidEmail(email)) {
      issues.push({ row: rowNumber(index), field: "contactEmail", message: "Invalid email" });
    }
    const existing = state.customers.find(
      (item) => item.name.toLowerCase() === (name ?? "").toLowerCase()
    );
    const action: ImportRowAction =
      issues.length > 0 ? "error" : existing ? "update" : "create";
    return { row: rowNumber(index), action, data, issues };
  });
  return summarize("customers", previews);
}

export function previewContactImport(state: CRMState, rows: CsvRow[]): ImportPreviewResult {
  const previews: ImportRowPreview[] = rows.map((data, index) => {
    const issues: ImportRowIssue[] = [];
    const name = data.name?.trim();
    const email = data.email?.trim();
    const company = data.company?.trim();
    if (!name) issues.push({ row: rowNumber(index), field: "name", message: "Name is required" });
    if (!email || !isValidEmail(email)) {
      issues.push({ row: rowNumber(index), field: "email", message: "Invalid email" });
    }
    if (!company) issues.push({ row: rowNumber(index), field: "company", message: "Company is required" });
    const existing = email
      ? state.contacts.find((item) => item.email.toLowerCase() === email.toLowerCase())
      : undefined;
    const action: ImportRowAction =
      issues.length > 0 ? "error" : existing ? "update" : "create";
    return { row: rowNumber(index), action, data, issues };
  });
  return summarize("contacts", previews);
}

export function previewEmployeeImport(state: CRMState, rows: CsvRow[]): ImportPreviewResult {
  const previews: ImportRowPreview[] = rows.map((data, index) => {
    const issues: ImportRowIssue[] = [];
    const name = data.name?.trim();
    const email = data.email?.trim();
    const role = (data.role?.trim() || "salesperson") as UserRole;
    if (!name) issues.push({ row: rowNumber(index), field: "name", message: "Name is required" });
    if (!email || !isValidEmail(email)) {
      issues.push({ row: rowNumber(index), field: "email", message: "Invalid email" });
    }
    if (!["salesperson", "sales_manager", "admin"].includes(role)) {
      issues.push({ row: rowNumber(index), field: "role", message: "Invalid role" });
    }
    const managerEmail = data.managerEmail?.trim();
    if (managerEmail) {
      const manager = state.users.find((item) => item.email.toLowerCase() === managerEmail.toLowerCase());
      if (!manager) issues.push({ row: rowNumber(index), field: "managerEmail", message: "Unknown manager" });
    }
    const team = data.team?.trim();
    if (team) {
      const teamConfig = state.organization.teams.find((item) => item.name === team);
      if (teamConfig?.status === "inactive") {
        issues.push({ row: rowNumber(index), field: "team", message: "Team is inactive" });
      }
    }
    const existing = email
      ? state.users.find((item) => item.email.toLowerCase() === email.toLowerCase())
      : undefined;
    const action: ImportRowAction =
      issues.length > 0 ? "error" : existing ? "update" : "create";
    return { row: rowNumber(index), action, data, issues };
  });
  return summarize("employees", previews);
}

export function previewDealImport(state: CRMState, rows: CsvRow[]): ImportPreviewResult {
  const previews: ImportRowPreview[] = rows.map((data, index) => {
    const issues: ImportRowIssue[] = [];
    const title = data.title?.trim();
    const customerName = data.customerName?.trim();
    const value = Number(data.value);
    const stage = (data.stage?.trim() || "new") as DealStage;
    const ownerEmail = data.ownerEmail?.trim();
    if (!title) issues.push({ row: rowNumber(index), field: "title", message: "Title is required" });
    if (!customerName) {
      issues.push({ row: rowNumber(index), field: "customerName", message: "Customer name is required" });
    }
    if (!Number.isFinite(value) || value < 0) {
      issues.push({ row: rowNumber(index), field: "value", message: "Invalid deal value" });
    }
    if (!DEAL_STAGES.includes(stage)) {
      issues.push({ row: rowNumber(index), field: "stage", message: "Invalid deal stage" });
    }
    if (ownerEmail) {
      const owner = state.users.find((item) => item.email.toLowerCase() === ownerEmail.toLowerCase());
      if (!owner) issues.push({ row: rowNumber(index), field: "ownerEmail", message: "Unknown owner" });
    }
    const existing = title
      ? state.deals.find((item) => item.title.toLowerCase() === title.toLowerCase())
      : undefined;
    const action: ImportRowAction =
      issues.length > 0 ? "error" : existing ? "update" : "create";
    return { row: rowNumber(index), action, data, issues };
  });
  return summarize("deals", previews);
}

export function previewImport(
  entityType: ImportEntityType,
  state: CRMState,
  rows: CsvRow[]
): ImportPreviewResult {
  if (entityType === "customers") return previewCustomerImport(state, rows);
  if (entityType === "contacts") return previewContactImport(state, rows);
  if (entityType === "employees") return previewEmployeeImport(state, rows);
  return previewDealImport(state, rows);
}

function summarize(entityType: ImportEntityType, rows: ImportRowPreview[]): ImportPreviewResult {
  const summary = { create: 0, update: 0, skip: 0, error: 0 };
  rows.forEach((row) => {
    summary[row.action] += 1;
  });
  return { entityType, rows, summary };
}

export type ExportEntityType =
  | "customers"
  | "contacts"
  | "deals"
  | "purchaseOrders"
  | "followUps"
  | "employees"
  | "salesTargets"
  | "auditLogs";

export const IMPORT_TEMPLATES: Record<ImportEntityType, string[]> = {
  customers: ["name", "industry", "location", "contactName", "contactEmail", "contactPhone", "status"],
  contacts: ["name", "company", "designation", "email", "phone", "status"],
  employees: ["name", "email", "role", "phone", "team", "managerEmail", "status"],
  deals: ["title", "customerName", "value", "stage", "ownerEmail", "probability", "expectedClose"],
};

export const EXPORT_HEADERS: Record<ExportEntityType, string[]> = {
  customers: ["id", "name", "industry", "location", "contactName", "contactEmail", "contactPhone", "status"],
  contacts: ["id", "name", "company", "designation", "email", "phone", "status"],
  deals: ["id", "title", "customerName", "value", "stage", "owner", "probability", "expectedClose"],
  purchaseOrders: ["id", "poNumber", "customerName", "amount", "status", "poDate", "deliveryDate"],
  followUps: ["id", "title", "customerName", "dueDate", "status", "priority", "owner"],
  employees: ["id", "name", "email", "role", "phone", "team", "managerId", "status"],
  salesTargets: ["id", "userId", "period", "periodType", "targetType", "targetAmount", "achievedAmount", "status"],
  auditLogs: ["id", "actorId", "action", "entityType", "entityId", "timestamp"],
};

export function buildExportRows(entityType: ExportEntityType, state: CRMState) {
  switch (entityType) {
    case "customers":
      return state.customers.map((item) => ({
        id: item.id,
        name: item.name,
        industry: item.industry,
        location: item.location,
        contactName: item.contactName,
        contactEmail: item.contactEmail,
        contactPhone: item.contactPhone,
        status: item.status,
      }));
    case "contacts":
      return state.contacts.map((item) => ({
        id: item.id,
        name: item.name,
        company: item.company,
        designation: item.designation,
        email: item.email,
        phone: item.phone,
        status: item.status,
      }));
    case "deals":
      return state.deals.map((item) => ({
        id: item.id,
        title: item.title,
        customerName: item.customerName,
        value: item.value,
        stage: item.stage,
        owner: item.owner,
        probability: item.probability,
        expectedClose: item.expectedClose,
      }));
    case "purchaseOrders":
      return state.purchaseOrders.map((item) => ({
        id: item.id,
        poNumber: item.poNumber,
        customerName: item.customerName,
        amount: item.amount,
        status: item.status,
        poDate: item.poDate,
        deliveryDate: item.deliveryDate,
      }));
    case "followUps":
      return state.followUps.map((item) => ({
        id: item.id,
        title: item.title,
        customerName: item.customerName,
        dueDate: item.dueDate,
        status: item.status,
        priority: item.priority,
        owner: item.owner,
      }));
    case "employees":
      return state.users.map((item) => ({
        id: item.id,
        name: item.name,
        email: item.email,
        role: item.role,
        phone: item.phone ?? "",
        team: item.team ?? "",
        managerId: item.managerId ?? "",
        status: item.status,
      }));
    case "salesTargets":
      return state.salesTargets.map((item) => ({
        id: item.id,
        userId: item.userId,
        period: item.period,
        periodType: item.periodType,
        targetType: item.targetType,
        targetAmount: item.targetAmount,
        achievedAmount: item.achievedAmount,
        status: item.status,
      }));
    case "auditLogs":
      return state.auditLogs.map((item) => ({
        id: item.id,
        actorId: item.actorId,
        action: item.action,
        entityType: item.entityType,
        entityId: item.entityId,
        timestamp: item.timestamp,
      }));
    default:
      return [];
  }
}
