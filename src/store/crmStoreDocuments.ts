import type { CreateAuditLogInput } from "./auditLogs";
import type { CRMState } from "./types";
import { generateId } from "./storage";
import {
  buildDocumentSummary,
  buildFutureStoragePath,
  buildMockProcessingResult,
  buildMockStoragePath,
  filterDocuments,
  getExtension,
  MOCK_STORAGE_BUCKET,
  normalizeDocument,
  type DocumentFilters,
  type DocumentLinkInput,
  type DocumentProcessingRecord,
  type DocumentProcessingType,
  type DocumentRecord,
  type DocumentSummary,
  type DocumentUploadInput,
  type DocumentVersionInput,
  type DocumentVersionRecord,
  validateUploadFile,
} from "./documents";

export type DocumentsStoreApi = {
  getState: () => CRMState;
  setState: (updater: (prev: CRMState) => CRMState) => void;
  withAuditEntries: (s: CRMState, entries: CreateAuditLogInput[]) => CRMState;
  requireDocumentView: () => void;
  requireDocumentManage: () => void;
  requireDocumentUpload: () => void;
  requireDocumentProcess: () => void;
  requireDocumentApprove: () => void;
  requireDocumentDelete: () => void;
  pushNotification: (notification: {
    title: string;
    message: string;
    severity: "info" | "warning" | "critical" | "success";
    href?: string;
    entityType?: string;
    entityId?: string;
  }) => void;
};

function getVersionsForDocument(
  documentId: string,
  versions: DocumentVersionRecord[]
): DocumentVersionRecord[] {
  return versions
    .filter((v) => v.documentId === documentId)
    .sort((a, b) => b.versionNumber - a.versionNumber);
}

function getProcessingForDocument(
  documentId: string,
  processing: DocumentProcessingRecord[]
): DocumentProcessingRecord[] {
  return processing
    .filter((p) => p.documentId === documentId)
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
}

export function createDocumentsStore(api: DocumentsStoreApi) {
  function listDocuments(filters?: DocumentFilters): DocumentRecord[] {
    api.requireDocumentView();
    return filterDocuments(api.getState().documents, filters).map(normalizeDocument);
  }

  function getDocument(id: string): DocumentRecord {
    api.requireDocumentView();
    const doc = api.getState().documents.find((item) => item.id === id);
    if (!doc) throw new Error("Document not found");
    return normalizeDocument(doc);
  }

  function getDocumentSummary(): DocumentSummary {
    api.requireDocumentView();
    return buildDocumentSummary(api.getState().documents);
  }

  function getDocumentVersions(documentId: string): DocumentVersionRecord[] {
    api.requireDocumentView();
    return getVersionsForDocument(documentId, api.getState().documentVersions);
  }

  function getProcessingHistory(documentId: string): DocumentProcessingRecord[] {
    api.requireDocumentView();
    return getProcessingForDocument(documentId, api.getState().documentProcessing);
  }

  function uploadDocument(input: DocumentUploadInput): DocumentRecord {
    api.requireDocumentUpload();
    validateUploadFile(input.file);

    const state = api.getState();
    const now = new Date().toISOString();
    const id = generateId("doc");
    const version = 1;
    const organizationId = state.organization.settings.id;
    const storagePath = buildMockStoragePath(id, version, input.file.name);
    const futurePath = buildFutureStoragePath(organizationId, id, version, input.file.name);

    const document = normalizeDocument({
      id,
      organizationId,
      name: input.file.name.replace(/\.[^.]+$/, ""),
      originalFileName: input.file.name,
      mimeType: input.file.type || "application/octet-stream",
      extension: getExtension(input.file.name),
      sizeBytes: input.file.size,
      storageProvider: "mock",
      storagePath,
      storageBucket: MOCK_STORAGE_BUCKET,
      status: input.startProcessing ? "PROCESSING" : "ACTIVE",
      category: input.category,
      entityType: input.entityType ?? "none",
      entityId: input.entityId,
      uploadedBy: state.currentUserId,
      uploadedAt: now,
      updatedAt: now,
      version,
      checksum: `mock-sha256-${id}-v${version}`,
      visibility: "organization",
      description: input.description,
      tags: input.tags ?? [],
      source: input.source ?? "manual_upload",
      sourceId: input.sourceId,
      aiProcessingStatus: input.startProcessing ? "queued" : "not_started",
      ocrStatus: input.startProcessing ? "queued" : "not_started",
      extractionStatus: "not_started",
      reviewStatus: "automatic",
      metadata: { mockMode: true, futureStoragePath: futurePath },
    });

    const versionRecord: DocumentVersionRecord = {
      id: generateId("dver"),
      documentId: id,
      versionNumber: version,
      storagePath,
      sizeBytes: input.file.size,
      checksum: document.checksum,
      uploadedBy: state.currentUserId,
      createdAt: now,
      changeNote: "Initial upload (mock metadata only)",
    };

    let created = document;
    api.setState((s) => {
      created = document;
      return api.withAuditEntries(
        {
          ...s,
          documents: [document, ...s.documents],
          documentVersions: [...s.documentVersions, versionRecord],
        },
        [
          {
            action: "created",
            entityType: "document",
            entityId: id,
            newValue: {
              name: document.name,
              category: document.category,
              status: document.status,
            },
            metadata: {
              mockMode: true,
              event: "DOCUMENT_CREATED",
              storagePath,
            },
          },
          {
            action: "created",
            entityType: "document",
            entityId: id,
            metadata: { mockMode: true, event: "DOCUMENT_UPLOADED", version },
          },
        ]
      );
    });

    if (input.startProcessing) {
      return startDocumentProcessing(id, "OCR");
    }

    return created;
  }

  function createDocumentVersion(documentId: string, input: DocumentVersionInput): DocumentRecord {
    api.requireDocumentManage();
    validateUploadFile(input.file);

    const existing = getDocument(documentId);
    const state = api.getState();
    const now = new Date().toISOString();
    const nextVersion = existing.version + 1;
    const storagePath = buildMockStoragePath(documentId, nextVersion, input.file.name);

    const versionRecord: DocumentVersionRecord = {
      id: generateId("dver"),
      documentId,
      versionNumber: nextVersion,
      storagePath,
      sizeBytes: input.file.size,
      checksum: `mock-sha256-${documentId}-v${nextVersion}`,
      uploadedBy: state.currentUserId,
      createdAt: now,
      changeNote: input.changeNote ?? "New version uploaded (mock)",
    };

    let updated!: DocumentRecord;
    api.setState((s) => {
      updated = normalizeDocument({
        ...existing,
        name: input.file.name.replace(/\.[^.]+$/, ""),
        originalFileName: input.file.name,
        mimeType: input.file.type || existing.mimeType,
        extension: getExtension(input.file.name),
        sizeBytes: input.file.size,
        storagePath,
        version: nextVersion,
        checksum: versionRecord.checksum,
        updatedAt: now,
        status: "ACTIVE",
      });
      return api.withAuditEntries(
        {
          ...s,
          documents: s.documents.map((doc) => (doc.id === documentId ? updated : doc)),
          documentVersions: [...s.documentVersions, versionRecord],
        },
        [
          {
            action: "updated",
            entityType: "document",
            entityId: documentId,
            metadata: {
              mockMode: true,
              event: "DOCUMENT_VERSION_CREATED",
              version: nextVersion,
            },
          },
        ]
      );
    });

    return updated;
  }

  function updateDocument(
    documentId: string,
    data: Partial<Pick<DocumentRecord, "name" | "description" | "tags" | "category" | "status">>
  ): DocumentRecord {
    api.requireDocumentManage();
    let updated!: DocumentRecord;
    api.setState((s) => {
      const existing = s.documents.find((doc) => doc.id === documentId);
      if (!existing) throw new Error("Document not found");
      updated = normalizeDocument({
        ...existing,
        ...data,
        updatedAt: new Date().toISOString(),
      });
      return api.withAuditEntries(
        { ...s, documents: s.documents.map((doc) => (doc.id === documentId ? updated : doc)) },
        [
          {
            action: "updated",
            entityType: "document",
            entityId: documentId,
            metadata: { mockMode: true, event: "DOCUMENT_UPDATED" },
          },
        ]
      );
    });
    return updated;
  }

  function linkDocument(documentId: string, input: DocumentLinkInput): DocumentRecord {
    api.requireDocumentManage();
    let updated!: DocumentRecord;
    api.setState((s) => {
      const existing = s.documents.find((doc) => doc.id === documentId);
      if (!existing) throw new Error("Document not found");
      updated = normalizeDocument({
        ...existing,
        entityType: input.entityType,
        entityId: input.entityId,
        updatedAt: new Date().toISOString(),
      });
      return api.withAuditEntries(
        { ...s, documents: s.documents.map((doc) => (doc.id === documentId ? updated : doc)) },
        [
          {
            action: "updated",
            entityType: "document",
            entityId: documentId,
            metadata: {
              mockMode: true,
              event: input.entityId ? "DOCUMENT_LINKED" : "DOCUMENT_UNLINKED",
              entityType: input.entityType,
              entityId: input.entityId,
            },
          },
        ]
      );
    });
    return updated;
  }

  function archiveDocument(documentId: string): DocumentRecord {
    api.requireDocumentManage();
    let updated!: DocumentRecord;
    api.setState((s) => {
      const existing = s.documents.find((doc) => doc.id === documentId);
      if (!existing) throw new Error("Document not found");
      updated = normalizeDocument({
        ...existing,
        status: "ARCHIVED",
        updatedAt: new Date().toISOString(),
      });
      return api.withAuditEntries(
        { ...s, documents: s.documents.map((doc) => (doc.id === documentId ? updated : doc)) },
        [
          {
            action: "updated",
            entityType: "document",
            entityId: documentId,
            metadata: { mockMode: true, event: "DOCUMENT_ARCHIVED" },
          },
        ]
      );
    });
    return updated;
  }

  function requestDeleteDocument(documentId: string): DocumentRecord {
    api.requireDocumentDelete();
    let updated!: DocumentRecord;
    api.setState((s) => {
      const existing = s.documents.find((doc) => doc.id === documentId);
      if (!existing) throw new Error("Document not found");
      updated = normalizeDocument({
        ...existing,
        status: "DELETED_PENDING",
        updatedAt: new Date().toISOString(),
      });
      return api.withAuditEntries(
        { ...s, documents: s.documents.map((doc) => (doc.id === documentId ? updated : doc)) },
        [
          {
            action: "deleted",
            entityType: "document",
            entityId: documentId,
            metadata: { mockMode: true, event: "DOCUMENT_DELETE_REQUESTED" },
          },
        ]
      );
    });
    return updated;
  }

  function startDocumentProcessing(
    documentId: string,
    processingType: DocumentProcessingType,
    options?: { simulateFailure?: boolean; simulateLowConfidence?: boolean }
  ): DocumentRecord {
    api.requireDocumentProcess();
    const existing = getDocument(documentId);
    const result = buildMockProcessingResult(documentId, processingType, {
      failed: options?.simulateFailure,
      lowConfidence: options?.simulateLowConfidence,
    });

    const now = new Date().toISOString();
    const isFailed = result.status === "failed";
    const isLowConfidence =
      !isFailed && result.confidence !== undefined && result.confidence < 0.75;

    let updated!: DocumentRecord;
    api.setState((s) => {
      const statusField =
        processingType === "OCR"
          ? "ocrStatus"
          : processingType === "AI_EXTRACTION"
            ? "extractionStatus"
            : "aiProcessingStatus";

      updated = normalizeDocument({
        ...existing,
        status: isFailed
          ? "FAILED"
          : isLowConfidence
            ? "REQUIRES_REVIEW"
            : processingType === "OCR"
              ? "PROCESSING"
              : existing.status === "PROCESSING"
                ? "ACTIVE"
                : existing.status,
        [statusField]: result.status,
        aiProcessingStatus:
          processingType === "AI_EXTRACTION" || processingType === "CLASSIFICATION"
            ? result.status
            : existing.aiProcessingStatus,
        reviewStatus: isLowConfidence ? "requires_review" : existing.reviewStatus,
        updatedAt: now,
      });

      return api.withAuditEntries(
        {
          ...s,
          documents: s.documents.map((doc) => (doc.id === documentId ? updated : doc)),
          documentProcessing: [result, ...s.documentProcessing],
        },
        [
          {
            action: "updated",
            entityType: "document",
            entityId: documentId,
            metadata: {
              mockMode: true,
              event: "DOCUMENT_PROCESSING_STARTED",
              processingType,
            },
          },
          {
            action: isFailed ? "updated" : "updated",
            entityType: "document",
            entityId: documentId,
            metadata: {
              mockMode: true,
              event: isFailed
                ? "DOCUMENT_PROCESSING_FAILED"
                : "DOCUMENT_PROCESSING_COMPLETED",
              processingType,
              confidence: result.confidence,
            },
          },
        ]
      );
    });

    if (isFailed) {
      api.pushNotification({
        title: "Document processing failed",
        message: `${existing.name} — ${result.errorMessage ?? "Processing failed (mock)"}`,
        severity: "critical",
        href: "/data-management/documents",
        entityType: "document",
        entityId: documentId,
      });
    } else if (isLowConfidence) {
      api.pushNotification({
        title: "Document requires review",
        message: `${existing.name} needs human review before approval`,
        severity: "warning",
        href: "/data-management/documents",
        entityType: "document",
        entityId: documentId,
      });
    } else if (processingType === "AI_EXTRACTION" && existing.category === "purchase_order") {
      api.pushNotification({
        title: "PO document processed",
        message: `${existing.name} extraction completed (mock)`,
        severity: "info",
        href: "/data-management/documents",
        entityType: "document",
        entityId: documentId,
      });
    }

    return updated;
  }

  function approveDocumentReview(documentId: string): DocumentRecord {
    api.requireDocumentApprove();
    let updated!: DocumentRecord;
    api.setState((s) => {
      const existing = s.documents.find((doc) => doc.id === documentId);
      if (!existing) throw new Error("Document not found");
      updated = normalizeDocument({
        ...existing,
        status: "APPROVED",
        reviewStatus: "approved",
        updatedAt: new Date().toISOString(),
      });
      return api.withAuditEntries(
        { ...s, documents: s.documents.map((doc) => (doc.id === documentId ? updated : doc)) },
        [
          {
            action: "approved",
            entityType: "document",
            entityId: documentId,
            metadata: { mockMode: true, event: "DOCUMENT_REVIEWED" },
          },
        ]
      );
    });
    return updated;
  }

  function rejectDocumentReview(documentId: string, reason?: string): DocumentRecord {
    api.requireDocumentApprove();
    let updated!: DocumentRecord;
    api.setState((s) => {
      const existing = s.documents.find((doc) => doc.id === documentId);
      if (!existing) throw new Error("Document not found");
      updated = normalizeDocument({
        ...existing,
        status: "REJECTED",
        reviewStatus: "rejected",
        updatedAt: new Date().toISOString(),
        metadata: { ...existing.metadata, rejectionReason: reason },
      });
      return api.withAuditEntries(
        { ...s, documents: s.documents.map((doc) => (doc.id === documentId ? updated : doc)) },
        [
          {
            action: "rejected",
            entityType: "document",
            entityId: documentId,
            metadata: { mockMode: true, event: "DOCUMENT_REVIEWED", reason },
          },
        ]
      );
    });
    return updated;
  }

  function getSignedDownloadUrl(documentId: string): string {
    api.requireDocumentView();
    const doc = getDocument(documentId);
    return `${doc.storagePath}?mockSigned=true&expires=300`;
  }

  function getPreviewUrl(documentId: string): string | null {
    api.requireDocumentView();
    const doc = getDocument(documentId);
    if (!doc.mimeType.startsWith("image/") && doc.mimeType !== "application/pdf") {
      return null;
    }
    return `${doc.storagePath}?mockPreview=true`;
  }

  return {
    listDocuments,
    getDocument,
    getDocumentSummary,
    getDocumentVersions,
    getProcessingHistory,
    uploadDocument,
    createDocumentVersion,
    updateDocument,
    linkDocument,
    archiveDocument,
    requestDeleteDocument,
    startDocumentProcessing,
    approveDocumentReview,
    rejectDocumentReview,
    getSignedDownloadUrl,
    getPreviewUrl,
  };
}

export {
  seedDocuments,
  seedDocumentVersions,
  seedDocumentProcessing,
} from "./documents";
