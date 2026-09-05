import { isBrowser, loadFromStorage, saveToStorage, STORAGE_KEYS } from "./storage";

export interface OrganizationLogo {
  id: string;
  organizationId: string;
  fileName: string;
  mimeType: string;
  size: number;
  /** Future Supabase path: organizations/{organizationId}/logo/{fileName} */
  storagePath: string;
  /** Mock reference or signed URL from storage provider */
  url: string;
  updatedAt: string;
}

export const ORGANIZATION_LOGO_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;

export type OrganizationLogoMimeType = (typeof ORGANIZATION_LOGO_MIME_TYPES)[number];

export const MAX_ORGANIZATION_LOGO_BYTES = 2 * 1024 * 1024;

export const ORGANIZATION_LOGO_BUCKET = "organizations";

const LOGO_BLOB_STORAGE_KEY = STORAGE_KEYS.organizationLogoBlobs;
const memoryBlobs: Record<string, string> = {};

function readBlobStore(): Record<string, string> {
  if (!isBrowser()) return { ...memoryBlobs };
  return loadFromStorage<Record<string, string>>(LOGO_BLOB_STORAGE_KEY, {});
}

function writeBlobStore(blobs: Record<string, string>) {
  Object.keys(memoryBlobs).forEach((key) => delete memoryBlobs[key]);
  Object.assign(memoryBlobs, blobs);
  if (!isBrowser()) return;
  saveToStorage(LOGO_BLOB_STORAGE_KEY, blobs);
}

export function buildOrganizationLogoStoragePath(organizationId: string, fileName: string) {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `organizations/${organizationId}/logo/${safeName}`;
}

export function buildMockOrganizationLogoUrl(storagePath: string) {
  return `mock://${storagePath}`;
}

export function formatLogoFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function saveMockLogoBlob(storagePath: string, dataUrl: string) {
  const blobs = readBlobStore();
  blobs[storagePath] = dataUrl;
  writeBlobStore(blobs);
}

export function getMockLogoBlob(storagePath: string): string | null {
  const blobs = readBlobStore();
  return blobs[storagePath] ?? null;
}

export function removeMockLogoBlob(storagePath: string) {
  const blobs = readBlobStore();
  delete blobs[storagePath];
  writeBlobStore(blobs);
}

export function clearMockLogoBlobs() {
  writeBlobStore({});
}

export function resolveOrganizationLogoUrl(logo: OrganizationLogo | null | undefined): string | null {
  if (!logo) return null;
  return getMockLogoBlob(logo.storagePath);
}

export async function readFileAsDataUrl(file: File): Promise<string> {
  if (typeof FileReader !== "undefined") {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result);
          return;
        }
        reject(new Error("Failed to read logo file"));
      };
      reader.onerror = () => reject(new Error("Failed to read logo file"));
      reader.readAsDataURL(file);
    });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  return `data:${file.type};base64,${buffer.toString("base64")}`;
}
