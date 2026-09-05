import { generateId } from "./storage";

/** Document lifecycle status — separate from OCR/AI processing status. */
export type DocumentStatus =
  | "ACTIVE"
  | "ARCHIVED"
  | "DELETED_PENDING"
  | "PROCESSING"
  | "REQUIRES_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "FAILED";

export type DocumentCategory =
  | "purchase_order"
  | "invoice"
  | "quote"
  | "contract"
  | "email_attachment"
  | "customer_document"
  | "deal_document"
  | "sales_document"
  | "other";

export type DocumentEntityType =
  | "customer"
  | "contact"
  | "deal"
  | "purchase_order"
  | "email"
  | "employee"
  | "organization"
  | "none";

export type DocumentSource =
  | "manual_upload"
  | "email"
  | "purchase_order"
  | "crm"
  | "import"
  | "automation";

export type DocumentVisibility = "organization" | "team" | "private";

export type DocumentProcessingStatus =
  | "not_started"
  | "queued"
  | "running"
  | "succeeded"
  | "failed"
  | "skipped";

export type DocumentReviewStatus =
  | "automatic"
  | "requires_review"
  | "approved"
  | "rejected";

export type DocumentProcessingType =
  | "OCR"
  | "AI_EXTRACTION"
  | "CLASSIFICATION"
  | "ENTITY_MATCHING";

export type DocumentStorageProvider = "mock" | "supabase" | "future_provider";

export interface DocumentRecord {
  id: string;
  organizationId: string;
  name: string;
  originalFileName: string;
  mimeType: string;
  extension: string;
  sizeBytes: number;
  storageProvider: DocumentStorageProvider;
  storagePath: string;
  storageBucket: string;
  status: DocumentStatus;
  category: DocumentCategory;
  entityType: DocumentEntityType;
  entityId?: string;
  uploadedBy: string;
  uploadedAt: string;
  updatedAt: string;
  version: number;
  checksum?: string;
  visibility: DocumentVisibility;
  description?: string;
  tags: string[];
  source: DocumentSource;
  sourceId?: string;
  aiProcessingStatus: DocumentProcessingStatus;
  ocrStatus: DocumentProcessingStatus;
  extractionStatus: DocumentProcessingStatus;
  reviewStatus: DocumentReviewStatus;
  metadata?: Record<string, unknown>;
}

export interface DocumentVersionRecord {
  id: string;
  documentId: string;
  versionNumber: number;
  storagePath: string;
  sizeBytes: number;
  checksum?: string;
  uploadedBy: string;
  createdAt: string;
  changeNote?: string;
}

export interface DocumentProcessingRecord {
  id: string;
  documentId: string;
  processingType: DocumentProcessingType;
  status: DocumentProcessingStatus;
  provider: string;
  model?: string;
  startedAt: string;
  completedAt?: string;
  confidence?: number;
  errorCode?: string;
  errorMessage?: string;
  outputReference?: string;
  metadata?: Record<string, unknown>;
}

export interface DocumentFilters {
  search?: string;
  category?: DocumentCategory | "all";
  status?: DocumentStatus | "all";
  source?: DocumentSource | "all";
  entityType?: DocumentEntityType | "all";
  dateFrom?: string;
  dateTo?: string;
  sort?: "uploaded_desc" | "uploaded_asc" | "name_asc" | "name_desc" | "size_desc";
}

export interface DocumentUploadInput {
  file: File;
  category: DocumentCategory;
  description?: string;
  tags?: string[];
  entityType?: DocumentEntityType;
  entityId?: string;
  source?: DocumentSource;
  sourceId?: string;
  startProcessing?: boolean;
}

export interface DocumentLinkInput {
  entityType: DocumentEntityType;
  entityId?: string;
}

export interface DocumentVersionInput {
  file: File;
  changeNote?: string;
}

export interface DocumentSummary {
  totalDocuments: number;
  processing: number;
  requiresReview: number;
  failed: number;
  storageUsedBytes: number;
}

export const DOCUMENT_CATEGORIES: { id: DocumentCategory; label: string }[] = [
  { id: "purchase_order", label: "Purchase Order" },
  { id: "invoice", label: "Invoice" },
  { id: "quote", label: "Quote" },
  { id: "contract", label: "Contract" },
  { id: "email_attachment", label: "Email Attachment" },
  { id: "customer_document", label: "Customer Document" },
  { id: "deal_document", label: "Deal Document" },
  { id: "sales_document", label: "Sales Document" },
  { id: "other", label: "Other" },
];

export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  ACTIVE: "Active",
  ARCHIVED: "Archived",
  DELETED_PENDING: "Delete Pending",
  PROCESSING: "Processing",
  REQUIRES_REVIEW: "Requires Review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  FAILED: "Failed",
};

export const DOCUMENT_ENTITY_LABELS: Record<DocumentEntityType, string> = {
  customer: "Customer",
  contact: "Contact",
  deal: "Deal",
  purchase_order: "Purchase Order",
  email: "Email",
  employee: "Employee",
  organization: "Organization",
  none: "None",
};

export const DOCUMENT_SOURCE_LABELS: Record<DocumentSource, string> = {
  manual_upload: "Manual Upload",
  email: "Email",
  purchase_order: "Purchase Order",
  crm: "CRM",
  import: "Import",
  automation: "Automation",
};

export const SUPPORTED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/png",
  "image/jpeg",
  "text/plain",
  "text/csv",
];

export const MAX_UPLOAD_SIZE_BYTES = 25 * 1024 * 1024;

export const MOCK_STORAGE_BUCKET = "documents";
export const FUTURE_STORAGE_BUCKET = "documents";

/** Future Supabase path: organizations/{orgId}/documents/{docId}/v{version}/{filename} */
export function buildFutureStoragePath(
  organizationId: string,
  documentId: string,
  version: number,
  filename: string
) {
  return `organizations/${organizationId}/documents/${documentId}/v${version}/${filename}`;
}

export function buildMockStoragePath(documentId: string, version: number, filename: string) {
  return `mock://documents/${documentId}/v${version}/${filename}`;
}

export function getCategoryLabel(category: DocumentCategory) {
  return DOCUMENT_CATEGORIES.find((item) => item.id === category)?.label ?? category;
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function getExtension(filename: string) {
  const parts = filename.split(".");
  return parts.length > 1 ? parts.pop()!.toLowerCase() : "";
}

export function validateUploadFile(file: File) {
  if (!file) throw new Error("A file is required");
  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    throw new Error(`File exceeds maximum size of ${formatFileSize(MAX_UPLOAD_SIZE_BYTES)}`);
  }
  if (file.type && !SUPPORTED_MIME_TYPES.includes(file.type)) {
    throw new Error("Unsupported file type");
  }
}

export function normalizeDocument(record: DocumentRecord): DocumentRecord {
  return {
    ...record,
    tags: record.tags ?? [],
    visibility: record.visibility ?? "organization",
    entityType: record.entityType ?? "none",
    source: record.source ?? "manual_upload",
    aiProcessingStatus: record.aiProcessingStatus ?? "not_started",
    ocrStatus: record.ocrStatus ?? "not_started",
    extractionStatus: record.extractionStatus ?? "not_started",
    reviewStatus: record.reviewStatus ?? "automatic",
  };
}

export function buildDocumentSummary(documents: DocumentRecord[]): DocumentSummary {
  const active = documents.filter((doc) => doc.status !== "DELETED_PENDING");
  return {
    totalDocuments: active.length,
    processing: active.filter((doc) => doc.status === "PROCESSING").length,
    requiresReview: active.filter((doc) => doc.status === "REQUIRES_REVIEW").length,
    failed: active.filter((doc) => doc.status === "FAILED").length,
    storageUsedBytes: active.reduce((sum, doc) => sum + doc.sizeBytes, 0),
  };
}

export function filterDocuments(documents: DocumentRecord[], filters?: DocumentFilters) {
  let results = documents.filter((doc) => doc.status !== "DELETED_PENDING");

  if (filters?.category && filters.category !== "all") {
    results = results.filter((doc) => doc.category === filters.category);
  }
  if (filters?.status && filters.status !== "all") {
    results = results.filter((doc) => doc.status === filters.status);
  }
  if (filters?.source && filters.source !== "all") {
    results = results.filter((doc) => doc.source === filters.source);
  }
  if (filters?.entityType && filters.entityType !== "all") {
    results = results.filter((doc) => doc.entityType === filters.entityType);
  }
  if (filters?.search?.trim()) {
    const q = filters.search.trim().toLowerCase();
    results = results.filter((doc) =>
      [doc.name, doc.originalFileName, doc.description ?? "", doc.tags.join(" "), doc.id]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }
  if (filters?.dateFrom) {
    const from = new Date(filters.dateFrom).getTime();
    results = results.filter((doc) => new Date(doc.uploadedAt).getTime() >= from);
  }
  if (filters?.dateTo) {
    const to = new Date(filters.dateTo).getTime();
    results = results.filter((doc) => new Date(doc.uploadedAt).getTime() <= to);
  }

  const sort = filters?.sort ?? "uploaded_desc";
  results.sort((a, b) => {
    if (sort === "name_asc") return a.name.localeCompare(b.name);
    if (sort === "name_desc") return b.name.localeCompare(a.name);
    if (sort === "size_desc") return b.sizeBytes - a.sizeBytes;
    if (sort === "uploaded_asc") {
      return new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
    }
    return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
  });

  return results;
}

export function buildMockProcessingResult(
  documentId: string,
  processingType: DocumentProcessingType,
  options?: { failed?: boolean; lowConfidence?: boolean }
): DocumentProcessingRecord {
  const now = new Date().toISOString();
  if (options?.failed) {
    return {
      id: generateId("dproc"),
      documentId,
      processingType,
      status: "failed",
      provider: "mock",
      model: "mock-ocr-v1",
      startedAt: now,
      completedAt: now,
      errorCode: "MOCK_PROCESSING_FAILED",
      errorMessage: "Mock processing failure (no real OCR/AI call)",
      metadata: { mockMode: true },
    };
  }

  const confidence = options?.lowConfidence ? 0.62 : 0.91;
  const outputReference = `mock://processing/${documentId}/${processingType.toLowerCase()}`;

  return {
    id: generateId("dproc"),
    documentId,
    processingType,
    status: "succeeded",
    provider: "mock",
    model: processingType === "OCR" ? "mock-ocr-v1" : "mock-extract-v1",
    startedAt: now,
    completedAt: now,
    confidence,
    outputReference,
    metadata: {
      mockMode: true,
      simulated: true,
      ...(processingType === "AI_EXTRACTION"
        ? {
            fields: {
              poNumber: "PO-MOCK-001",
              customer: "ACME Industries (mock)",
              orderDate: "2026-08-15",
              currency: "INR",
              totalAmount: 125000,
              deliveryDate: "2026-09-30",
            },
          }
        : {}),
    },
  };
}

function seedVersion(
  documentId: string,
  versionNumber: number,
  storagePath: string,
  sizeBytes: number,
  uploadedBy: string,
  createdAt: string,
  changeNote?: string
): DocumentVersionRecord {
  return {
    id: generateId("dver"),
    documentId,
    versionNumber,
    storagePath,
    sizeBytes,
    checksum: `mock-sha256-${documentId}-v${versionNumber}`,
    uploadedBy,
    createdAt,
    changeNote,
  };
}

function seedProcessing(
  documentId: string,
  processingType: DocumentProcessingType,
  status: DocumentProcessingStatus,
  confidence?: number,
  errorMessage?: string
): DocumentProcessingRecord {
  const now = "2026-08-28T10:00:00Z";
  return {
    id: generateId("dproc"),
    documentId,
    processingType,
    status,
    provider: "mock",
    model: processingType === "OCR" ? "mock-ocr-v1" : "mock-extract-v1",
    startedAt: now,
    completedAt: status === "running" ? undefined : now,
    confidence,
    errorMessage,
    outputReference: status === "succeeded" ? `mock://processing/${documentId}/${processingType}` : undefined,
    metadata: { mockMode: true, simulated: true },
  };
}

export const seedDocumentVersions: DocumentVersionRecord[] = [];
export const seedDocumentProcessing: DocumentProcessingRecord[] = [];

const orgId = "org-1";

export const seedDocuments: DocumentRecord[] = [
  normalizeDocument({
    id: "doc-1",
    organizationId: orgId,
    name: "ACME Industries PO",
    originalFileName: "ACME Industries PO.pdf",
    mimeType: "application/pdf",
    extension: "pdf",
    sizeBytes: 248576,
    storageProvider: "mock",
    storagePath: buildMockStoragePath("doc-1", 1, "ACME Industries PO.pdf"),
    storageBucket: MOCK_STORAGE_BUCKET,
    status: "APPROVED",
    category: "purchase_order",
    entityType: "purchase_order",
    entityId: "po-1",
    uploadedBy: "user-1",
    uploadedAt: "2026-08-20T09:15:00Z",
    updatedAt: "2026-08-28T11:00:00Z",
    version: 1,
    checksum: "mock-sha256-doc-1-v1",
    visibility: "organization",
    description: "Purchase order received from ACME Industries",
    tags: ["po", "acme", "approved"],
    source: "manual_upload",
    aiProcessingStatus: "succeeded",
    ocrStatus: "succeeded",
    extractionStatus: "succeeded",
    reviewStatus: "approved",
    metadata: { mockMode: true },
  }),
  normalizeDocument({
    id: "doc-2",
    organizationId: orgId,
    name: "Global Tech Contract",
    originalFileName: "Global Tech Contract.pdf",
    mimeType: "application/pdf",
    extension: "pdf",
    sizeBytes: 512000,
    storageProvider: "mock",
    storagePath: buildMockStoragePath("doc-2", 1, "Global Tech Contract.pdf"),
    storageBucket: MOCK_STORAGE_BUCKET,
    status: "ACTIVE",
    category: "contract",
    entityType: "customer",
    entityId: "cust-2",
    uploadedBy: "user-2",
    uploadedAt: "2026-08-22T14:30:00Z",
    updatedAt: "2026-08-22T14:30:00Z",
    version: 1,
    checksum: "mock-sha256-doc-2-v1",
    visibility: "organization",
    tags: ["contract", "global-tech"],
    source: "crm",
    aiProcessingStatus: "not_started",
    ocrStatus: "not_started",
    extractionStatus: "not_started",
    reviewStatus: "automatic",
    metadata: { mockMode: true },
  }),
  normalizeDocument({
    id: "doc-3",
    organizationId: orgId,
    name: "Client Quote",
    originalFileName: "Client Quote.docx",
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    extension: "docx",
    sizeBytes: 98304,
    storageProvider: "mock",
    storagePath: buildMockStoragePath("doc-3", 1, "Client Quote.docx"),
    storageBucket: MOCK_STORAGE_BUCKET,
    status: "REQUIRES_REVIEW",
    category: "quote",
    entityType: "deal",
    entityId: "deal-1",
    uploadedBy: "user-3",
    uploadedAt: "2026-08-25T08:00:00Z",
    updatedAt: "2026-08-27T16:45:00Z",
    version: 1,
    checksum: "mock-sha256-doc-3-v1",
    visibility: "organization",
    tags: ["quote", "review"],
    source: "manual_upload",
    aiProcessingStatus: "succeeded",
    ocrStatus: "succeeded",
    extractionStatus: "succeeded",
    reviewStatus: "requires_review",
    metadata: { mockMode: true, extractionConfidence: 0.62 },
  }),
  normalizeDocument({
    id: "doc-4",
    organizationId: orgId,
    name: "Email Attachment — pricing",
    originalFileName: "pricing.xlsx",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    extension: "xlsx",
    sizeBytes: 65536,
    storageProvider: "mock",
    storagePath: buildMockStoragePath("doc-4", 1, "pricing.xlsx"),
    storageBucket: MOCK_STORAGE_BUCKET,
    status: "PROCESSING",
    category: "email_attachment",
    entityType: "email",
    entityId: "email-1",
    uploadedBy: "user-1",
    uploadedAt: "2026-08-29T06:00:00Z",
    updatedAt: "2026-08-29T06:05:00Z",
    version: 1,
    checksum: "mock-sha256-doc-4-v1",
    visibility: "organization",
    tags: ["email", "pricing"],
    source: "email",
    sourceId: "email-1",
    aiProcessingStatus: "running",
    ocrStatus: "queued",
    extractionStatus: "not_started",
    reviewStatus: "automatic",
    metadata: { mockMode: true },
  }),
  normalizeDocument({
    id: "doc-5",
    organizationId: orgId,
    name: "Customer Agreement",
    originalFileName: "Customer Agreement.pdf",
    mimeType: "application/pdf",
    extension: "pdf",
    sizeBytes: 356352,
    storageProvider: "mock",
    storagePath: buildMockStoragePath("doc-5", 2, "Customer Agreement.pdf"),
    storageBucket: MOCK_STORAGE_BUCKET,
    status: "ACTIVE",
    category: "customer_document",
    entityType: "customer",
    entityId: "cust-1",
    uploadedBy: "user-1",
    uploadedAt: "2026-08-10T12:00:00Z",
    updatedAt: "2026-08-18T09:30:00Z",
    version: 2,
    checksum: "mock-sha256-doc-5-v2",
    visibility: "organization",
    description: "Signed customer agreement — version 2",
    tags: ["agreement", "customer"],
    source: "manual_upload",
    aiProcessingStatus: "succeeded",
    ocrStatus: "succeeded",
    extractionStatus: "skipped",
    reviewStatus: "approved",
    metadata: { mockMode: true },
  }),
  normalizeDocument({
    id: "doc-6",
    organizationId: orgId,
    name: "Failed PO Scan",
    originalFileName: "damaged-scan.pdf",
    mimeType: "application/pdf",
    extension: "pdf",
    sizeBytes: 128000,
    storageProvider: "mock",
    storagePath: buildMockStoragePath("doc-6", 1, "damaged-scan.pdf"),
    storageBucket: MOCK_STORAGE_BUCKET,
    status: "FAILED",
    category: "purchase_order",
    entityType: "none",
    uploadedBy: "user-2",
    uploadedAt: "2026-08-26T17:00:00Z",
    updatedAt: "2026-08-26T17:10:00Z",
    version: 1,
    checksum: "mock-sha256-doc-6-v1",
    visibility: "organization",
    tags: ["po", "failed"],
    source: "automation",
    sourceId: "aexec-1",
    aiProcessingStatus: "failed",
    ocrStatus: "failed",
    extractionStatus: "not_started",
    reviewStatus: "automatic",
    metadata: { mockMode: true },
  }),
];

seedDocumentVersions.push(
  seedVersion("doc-1", 1, buildMockStoragePath("doc-1", 1, "ACME Industries PO.pdf"), 248576, "user-1", "2026-08-20T09:15:00Z"),
  seedVersion("doc-5", 1, buildMockStoragePath("doc-5", 1, "Customer Agreement.pdf"), 340000, "user-1", "2026-08-10T12:00:00Z", "Initial upload"),
  seedVersion("doc-5", 2, buildMockStoragePath("doc-5", 2, "Customer Agreement.pdf"), 356352, "user-1", "2026-08-18T09:30:00Z", "Updated signed copy")
);

seedDocumentProcessing.push(
  seedProcessing("doc-1", "OCR", "succeeded", 0.94),
  seedProcessing("doc-1", "AI_EXTRACTION", "succeeded", 0.89),
  seedProcessing("doc-3", "OCR", "succeeded", 0.88),
  seedProcessing("doc-3", "AI_EXTRACTION", "succeeded", 0.62),
  seedProcessing("doc-4", "OCR", "running"),
  seedProcessing("doc-6", "OCR", "failed", undefined, "Mock OCR failure — unreadable scan (simulated)")
);
