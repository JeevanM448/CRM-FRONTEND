import { delay } from "@/store/storage";
import * as store from "@/store/crmStore";
import type {
  DocumentFilters,
  DocumentLinkInput,
  DocumentProcessingType,
  DocumentUploadInput,
  DocumentVersionInput,
} from "@/store/documents";

export async function listDocuments(filters?: DocumentFilters) {
  await delay();
  return store.getDocuments(filters);
}

export async function getDocument(id: string) {
  await delay();
  return store.getDocument(id);
}

export async function getDocumentSummary() {
  await delay();
  return store.getDocumentSummary();
}

export async function getDocumentVersions(id: string) {
  await delay();
  return store.getDocumentVersions(id);
}

export async function getProcessingHistory(id: string) {
  await delay();
  return store.getDocumentProcessingHistory(id);
}

export async function uploadDocument(input: DocumentUploadInput) {
  await delay();
  return store.uploadDocument(input);
}

export async function createDocumentVersion(id: string, input: DocumentVersionInput) {
  await delay();
  return store.createDocumentVersion(id, input);
}

export async function updateDocument(
  id: string,
  data: Parameters<typeof store.updateDocument>[1]
) {
  await delay();
  return store.updateDocument(id, data);
}

export async function linkDocument(id: string, input: DocumentLinkInput) {
  await delay();
  return store.linkDocument(id, input);
}

export async function archiveDocument(id: string) {
  await delay();
  return store.archiveDocument(id);
}

export async function requestDeleteDocument(id: string) {
  await delay();
  return store.requestDeleteDocument(id);
}

export async function startDocumentProcessing(
  id: string,
  processingType: DocumentProcessingType,
  options?: { simulateFailure?: boolean; simulateLowConfidence?: boolean }
) {
  await delay();
  return store.startDocumentProcessing(id, processingType, options);
}

export async function approveDocumentReview(id: string) {
  await delay();
  return store.approveDocumentReview(id);
}

export async function rejectDocumentReview(id: string, reason?: string) {
  await delay();
  return store.rejectDocumentReview(id, reason);
}

export async function getSignedDownloadUrl(id: string) {
  await delay();
  return store.getSignedDownloadUrl(id);
}

export async function getPreviewUrl(id: string) {
  await delay();
  return store.getPreviewUrl(id);
}
