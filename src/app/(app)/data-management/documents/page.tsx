"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Archive,
  Download,
  Eye,
  FileText,
  Link2,
  RefreshCw,
  Shield,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { KpiCard } from "@/components/ui/kpi-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/utils";
import { useCRMStore, usePermissions } from "@/store/CRMStoreProvider";
import { documentService } from "@/services";
import {
  DOCUMENT_CATEGORIES,
  DOCUMENT_ENTITY_LABELS,
  DOCUMENT_SOURCE_LABELS,
  DOCUMENT_STATUS_LABELS,
  formatFileSize,
  type DocumentCategory,
  type DocumentEntityType,
  type DocumentFilters,
  type DocumentProcessingType,
  type DocumentRecord,
  type DocumentSource,
  type DocumentStatus,
} from "@/store/documents";

function processingLabel(doc: DocumentRecord) {
  if (doc.ocrStatus === "running" || doc.aiProcessingStatus === "running") return "Processing";
  if (doc.status === "REQUIRES_REVIEW") return "Review";
  if (doc.ocrStatus === "failed" || doc.aiProcessingStatus === "failed") return "Failed";
  if (doc.extractionStatus === "succeeded") return "Extracted";
  if (doc.ocrStatus === "succeeded") return "OCR done";
  return "—";
}

export default function DocumentsPage() {
  const {
    canViewDocuments,
    canManageDocuments,
    canUploadDocuments,
    canProcessDocuments,
    canApproveDocuments,
    canDeleteDocuments,
  } = usePermissions();
  const { getDocuments, getDocumentSummary, getUsers, getSnapshot } = useCRMStore();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<DocumentCategory | "all">("all");
  const [status, setStatus] = useState<DocumentStatus | "all">("all");
  const [source, setSource] = useState<DocumentSource | "all">("all");
  const [entityType, setEntityType] = useState<DocumentEntityType | "all">("all");
  const [sort, setSort] = useState<DocumentFilters["sort"]>("uploaded_desc");

  const [uploadOpen, setUploadOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [versionId, setVersionId] = useState<string | null>(null);
  const [linkId, setLinkId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadCategory, setUploadCategory] = useState<DocumentCategory>("other");
  const [uploadDescription, setUploadDescription] = useState("");
  const [uploadTags, setUploadTags] = useState("");
  const [uploadEntityType, setUploadEntityType] = useState<DocumentEntityType>("none");
  const [uploadEntityId, setUploadEntityId] = useState("");
  const [uploadStartProcessing, setUploadStartProcessing] = useState(false);

  const [versionFile, setVersionFile] = useState<File | null>(null);
  const [versionNote, setVersionNote] = useState("");

  const [linkEntityType, setLinkEntityType] = useState<DocumentEntityType>("none");
  const [linkEntityId, setLinkEntityId] = useState("");

  const filters: DocumentFilters = {
    search,
    category,
    status,
    source,
    entityType,
    sort,
  };

  const documents = getDocuments(filters);
  const summary = getDocumentSummary();
  const users = getUsers();
  const state = getSnapshot();

  const detailDoc = detailId ? documents.find((d) => d.id === detailId) ?? getDocuments().find((d) => d.id === detailId) : null;
  const versions = detailId ? state.documentVersions.filter((v) => v.documentId === detailId) : [];
  const processing = detailId ? state.documentProcessing.filter((p) => p.documentId === detailId) : [];

  const entityOptions = useMemo(() => {
    switch (uploadEntityType) {
      case "customer":
        return state.customers.map((c) => ({ id: c.id, label: c.name }));
      case "contact":
        return state.contacts.map((c) => ({ id: c.id, label: c.name }));
      case "deal":
        return state.deals.map((d) => ({ id: d.id, label: d.title }));
      case "purchase_order":
        return state.purchaseOrders.map((p) => ({ id: p.id, label: p.poNumber }));
      case "email":
        return state.emails.map((e) => ({ id: e.id, label: e.subject }));
      case "employee":
        return state.users.map((u) => ({ id: u.id, label: u.name }));
      default:
        return [];
    }
  }, [uploadEntityType, state]);

  const linkEntityOptions = useMemo(() => {
    switch (linkEntityType) {
      case "customer":
        return state.customers.map((c) => ({ id: c.id, label: c.name }));
      case "contact":
        return state.contacts.map((c) => ({ id: c.id, label: c.name }));
      case "deal":
        return state.deals.map((d) => ({ id: d.id, label: d.title }));
      case "purchase_order":
        return state.purchaseOrders.map((p) => ({ id: p.id, label: p.poNumber }));
      case "email":
        return state.emails.map((e) => ({ id: e.id, label: e.subject }));
      case "employee":
        return state.users.map((u) => ({ id: u.id, label: u.name }));
      default:
        return [];
    }
  }, [linkEntityType, state]);

  function resolveEntityName(doc: DocumentRecord) {
    if (!doc.entityId || doc.entityType === "none") return "—";
    switch (doc.entityType) {
      case "customer":
        return state.customers.find((c) => c.id === doc.entityId)?.name ?? doc.entityId;
      case "contact":
        return state.contacts.find((c) => c.id === doc.entityId)?.name ?? doc.entityId;
      case "deal":
        return state.deals.find((d) => d.id === doc.entityId)?.title ?? doc.entityId;
      case "purchase_order":
        return state.purchaseOrders.find((p) => p.id === doc.entityId)?.poNumber ?? doc.entityId;
      case "email":
        return state.emails.find((e) => e.id === doc.entityId)?.subject ?? doc.entityId;
      case "employee":
        return state.users.find((u) => u.id === doc.entityId)?.name ?? doc.entityId;
      case "organization":
        return state.organization.settings.companyName;
      default:
        return doc.entityId;
    }
  }

  function entityHref(doc: DocumentRecord) {
    if (!doc.entityId || doc.entityType === "none") return null;
    switch (doc.entityType) {
      case "customer":
        return `/customers/${doc.entityId}`;
      case "deal":
        return `/deals/${doc.entityId}`;
      case "purchase_order":
        return `/purchase-orders/${doc.entityId}`;
      case "email":
        return `/inbox`;
      case "employee":
        return `/users`;
      default:
        return null;
    }
  }

  function resetUploadForm() {
    setUploadFile(null);
    setUploadCategory("other");
    setUploadDescription("");
    setUploadTags("");
    setUploadEntityType("none");
    setUploadEntityId("");
    setUploadStartProcessing(false);
  }

  async function handleUpload() {
    if (!uploadFile) {
      toast.error("Please select a file");
      return;
    }
    setSaving(true);
    try {
      await documentService.uploadDocument({
        file: uploadFile,
        category: uploadCategory,
        description: uploadDescription || undefined,
        tags: uploadTags.split(",").map((t) => t.trim()).filter(Boolean),
        entityType: uploadEntityType,
        entityId: uploadEntityId || undefined,
        startProcessing: uploadStartProcessing,
      });
      toast.success("Document metadata saved (mock — no binary stored)");
      setUploadOpen(false);
      resetUploadForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleNewVersion() {
    if (!versionId || !versionFile) {
      toast.error("Please select a file");
      return;
    }
    setSaving(true);
    try {
      await documentService.createDocumentVersion(versionId, {
        file: versionFile,
        changeNote: versionNote || undefined,
      });
      toast.success("New version created (mock metadata)");
      setVersionId(null);
      setVersionFile(null);
      setVersionNote("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Version upload failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleLink() {
    if (!linkId) return;
    setSaving(true);
    try {
      await documentService.linkDocument(linkId, {
        entityType: linkEntityType,
        entityId: linkEntityId || undefined,
      });
      toast.success("Document link updated");
      setLinkId(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Link failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleArchive(id: string) {
    try {
      await documentService.archiveDocument(id);
      toast.success("Document archived");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Archive failed");
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await documentService.requestDeleteDocument(deleteId);
      toast.success("Delete requested (mock)");
      setDeleteId(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete request failed");
    }
  }

  async function handleProcess(id: string, type: DocumentProcessingType) {
    try {
      await documentService.startDocumentProcessing(id, type);
      toast.success(`Mock ${type} processing completed`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Processing failed");
    }
  }

  async function handleApprove(id: string) {
    try {
      await documentService.approveDocumentReview(id);
      toast.success("Document approved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Approval failed");
    }
  }

  async function handleReject(id: string) {
    try {
      await documentService.rejectDocumentReview(id, "Rejected from documents UI");
      toast.success("Document rejected");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Rejection failed");
    }
  }

  async function handleMockDownload(id: string) {
    try {
      const url = await documentService.getSignedDownloadUrl(id);
      toast.info(`Mock download URL: ${url}`, {
        description: "No real file is stored or downloaded in mock mode.",
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Download unavailable");
    }
  }

  if (!canViewDocuments || !canManageDocuments) {
    return (
      <EmptyState
        icon={Shield}
        title="Access restricted"
        description="Organization document management is available to administrators only."
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documents"
        description="Manage organization documents, versions, and processing metadata. Storage is mock/backend-contract only."
        actions={
          canUploadDocuments ? (
            <Button onClick={() => setUploadOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Upload Document
            </Button>
          ) : undefined
        }
      />

      <Card className="border-dashed border-warning/40 bg-warning/5">
        <CardContent className="flex items-start gap-3 p-4 text-sm">
          <FileText className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <p>
            Document storage is <strong>mock metadata only</strong>. No binary files are persisted
            in the browser. Future backend will use private Supabase Storage buckets with signed URLs.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard label="Total Documents" value={String(summary.totalDocuments)} subValue="Mock registry" />
        <KpiCard label="Processing" value={String(summary.processing)} />
        <KpiCard label="Requires Review" value={String(summary.requiresReview)} />
        <KpiCard label="Failed" value={String(summary.failed)} />
        <KpiCard
          label="Storage Used"
          value={formatFileSize(summary.storageUsedBytes)}
          subValue="Metadata estimate"
        />
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <CardTitle className="text-base">Document Library</CardTitle>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
            <Input
              placeholder="Search documents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Select value={category} onValueChange={(v) => setCategory(v as DocumentCategory | "all")}>
              <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {DOCUMENT_CATEGORIES.map((item) => (
                  <SelectItem key={item.id} value={item.id}>{item.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={(v) => setStatus(v as DocumentStatus | "all")}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {Object.entries(DOCUMENT_STATUS_LABELS).map(([id, label]) => (
                  <SelectItem key={id} value={id}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={source} onValueChange={(v) => setSource(v as DocumentSource | "all")}>
              <SelectTrigger><SelectValue placeholder="Source" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All sources</SelectItem>
                {Object.entries(DOCUMENT_SOURCE_LABELS).map(([id, label]) => (
                  <SelectItem key={id} value={id}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={entityType} onValueChange={(v) => setEntityType(v as DocumentEntityType | "all")}>
              <SelectTrigger><SelectValue placeholder="Entity" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All entities</SelectItem>
                {Object.entries(DOCUMENT_ENTITY_LABELS).map(([id, label]) => (
                  <SelectItem key={id} value={id}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={(v) => setSort(v as DocumentFilters["sort"])}>
              <SelectTrigger><SelectValue placeholder="Sort" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="uploaded_desc">Newest first</SelectItem>
                <SelectItem value="uploaded_asc">Oldest first</SelectItem>
                <SelectItem value="name_asc">Name A–Z</SelectItem>
                <SelectItem value="name_desc">Name Z–A</SelectItem>
                <SelectItem value="size_desc">Largest first</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No documents found"
              description="Upload a document or adjust your filters."
            />
          ) : (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>File</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Linked To</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Uploaded By</TableHead>
                      <TableHead>Uploaded</TableHead>
                      <TableHead>Processing</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documents.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell>
                          <div className="font-medium">{doc.name}</div>
                          <div className="text-xs text-muted-foreground">{doc.originalFileName}</div>
                        </TableCell>
                        <TableCell>{DOCUMENT_CATEGORIES.find((c) => c.id === doc.category)?.label}</TableCell>
                        <TableCell>
                          <div className="text-sm">{DOCUMENT_ENTITY_LABELS[doc.entityType]}</div>
                          <div className="text-xs text-muted-foreground">{resolveEntityName(doc)}</div>
                        </TableCell>
                        <TableCell>{formatFileSize(doc.sizeBytes)}</TableCell>
                        <TableCell>{users.find((u) => u.id === doc.uploadedBy)?.name ?? doc.uploadedBy}</TableCell>
                        <TableCell>{formatDateTime(doc.uploadedAt)}</TableCell>
                        <TableCell>{processingLabel(doc)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{DOCUMENT_STATUS_LABELS[doc.status]}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="sm" variant="ghost" onClick={() => setDetailId(doc.id)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            {canManageDocuments && (
                              <>
                                <Button size="sm" variant="ghost" onClick={() => handleMockDownload(doc.id)}>
                                  <Download className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => { setLinkId(doc.id); setLinkEntityType(doc.entityType); setLinkEntityId(doc.entityId ?? ""); }}>
                                  <Link2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="space-y-3 lg:hidden">
                {documents.map((doc) => (
                  <Card key={doc.id}>
                    <CardContent className="space-y-3 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium">{doc.name}</p>
                          <p className="text-xs text-muted-foreground">{doc.originalFileName}</p>
                        </div>
                        <Badge variant="outline">{DOCUMENT_STATUS_LABELS[doc.status]}</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                        <span>{formatFileSize(doc.sizeBytes)}</span>
                        <span>{processingLabel(doc)}</span>
                        <span className="col-span-2">{resolveEntityName(doc)}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={() => setDetailId(doc.id)}>Details</Button>
                        <Button size="sm" variant="outline" onClick={() => handleMockDownload(doc.id)}>Download</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Creates document metadata and a mock storage reference. No binary is stored locally.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>File</Label>
              <Input
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.txt,.csv"
                onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
              />
              {uploadFile && (
                <p className="text-xs text-muted-foreground">
                  {uploadFile.name} · {formatFileSize(uploadFile.size)} · {uploadFile.type || "unknown"}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={uploadCategory} onValueChange={(v) => setUploadCategory(v as DocumentCategory)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DOCUMENT_CATEGORIES.map((item) => (
                    <SelectItem key={item.id} value={item.id}>{item.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={uploadDescription} onChange={(e) => setUploadDescription(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Tags (comma-separated)</Label>
              <Input value={uploadTags} onChange={(e) => setUploadTags(e.target.value)} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Entity type</Label>
                <Select value={uploadEntityType} onValueChange={(v) => { setUploadEntityType(v as DocumentEntityType); setUploadEntityId(""); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(DOCUMENT_ENTITY_LABELS).map(([id, label]) => (
                      <SelectItem key={id} value={id}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {uploadEntityType !== "none" && uploadEntityType !== "organization" && (
                <div className="space-y-2">
                  <Label>Entity</Label>
                  <Select value={uploadEntityId} onValueChange={setUploadEntityId}>
                    <SelectTrigger><SelectValue placeholder="Select entity" /></SelectTrigger>
                    <SelectContent>
                      {entityOptions.map((item) => (
                        <SelectItem key={item.id} value={item.id}>{item.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between">
              <Label>Start mock OCR processing after upload</Label>
              <Switch checked={uploadStartProcessing} onCheckedChange={setUploadStartProcessing} />
            </div>
          </div>
          <DialogFooter>
            <SubmitButton loading={saving} onClick={handleUpload}>Upload (Mock)</SubmitButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!detailId} onOpenChange={() => setDetailId(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          {detailDoc && (
            <>
              <DialogHeader>
                <DialogTitle>{detailDoc.name}</DialogTitle>
                <DialogDescription>{detailDoc.originalFileName}</DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                <section className="space-y-2">
                  <h4 className="text-sm font-semibold">Overview</h4>
                  <div className="grid gap-2 text-sm sm:grid-cols-2">
                    <div><span className="text-muted-foreground">Category:</span> {DOCUMENT_CATEGORIES.find((c) => c.id === detailDoc.category)?.label}</div>
                    <div><span className="text-muted-foreground">Size:</span> {formatFileSize(detailDoc.sizeBytes)}</div>
                    <div><span className="text-muted-foreground">Type:</span> {detailDoc.mimeType}</div>
                    <div><span className="text-muted-foreground">Status:</span> {DOCUMENT_STATUS_LABELS[detailDoc.status]}</div>
                    <div><span className="text-muted-foreground">Uploaded:</span> {formatDateTime(detailDoc.uploadedAt)}</div>
                    <div><span className="text-muted-foreground">By:</span> {users.find((u) => u.id === detailDoc.uploadedBy)?.name}</div>
                  </div>
                </section>

                <section className="space-y-2">
                  <h4 className="text-sm font-semibold">Storage</h4>
                  <div className="rounded-md border p-3 text-sm">
                    <p><span className="text-muted-foreground">Provider:</span> {detailDoc.storageProvider}</p>
                    <p><span className="text-muted-foreground">Bucket:</span> {detailDoc.storageBucket}</p>
                    <p className="break-all"><span className="text-muted-foreground">Path:</span> {detailDoc.storagePath}</p>
                    <p><span className="text-muted-foreground">Version:</span> v{detailDoc.version}</p>
                    {detailDoc.checksum && <p><span className="text-muted-foreground">Checksum:</span> {detailDoc.checksum}</p>}
                  </div>
                </section>

                <section className="space-y-2">
                  <h4 className="text-sm font-semibold">Linked CRM Entity</h4>
                  <div className="flex items-center justify-between rounded-md border p-3 text-sm">
                    <div>
                      <p>{DOCUMENT_ENTITY_LABELS[detailDoc.entityType]}</p>
                      <p className="text-muted-foreground">{resolveEntityName(detailDoc)}</p>
                    </div>
                    {entityHref(detailDoc) && (
                      <Button asChild size="sm" variant="outline">
                        <Link href={entityHref(detailDoc)!}>Open</Link>
                      </Button>
                    )}
                  </div>
                </section>

                <section className="space-y-2">
                  <h4 className="text-sm font-semibold">Processing</h4>
                  <div className="grid gap-2 text-sm sm:grid-cols-3">
                    <Badge variant="outline">OCR: {detailDoc.ocrStatus}</Badge>
                    <Badge variant="outline">AI: {detailDoc.aiProcessingStatus}</Badge>
                    <Badge variant="outline">Extraction: {detailDoc.extractionStatus}</Badge>
                  </div>
                  {processing.length > 0 && (
                    <div className="space-y-2">
                      {processing.map((item) => (
                        <div key={item.id} className="rounded-md border p-2 text-xs">
                          <p className="font-medium">{item.processingType} — {item.status}</p>
                          {item.confidence !== undefined && <p>Confidence: {item.confidence}</p>}
                          {item.errorMessage && <p className="text-danger">{item.errorMessage}</p>}
                          {item.metadata?.simulated === true && (
                            <p className="text-muted-foreground">Mock simulated result</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {versions.length > 0 && (
                  <section className="space-y-2">
                    <h4 className="text-sm font-semibold">Versions</h4>
                    {versions.map((v) => (
                      <div key={v.id} className="rounded-md border p-2 text-sm">
                        <p>v{v.versionNumber} · {formatFileSize(v.sizeBytes)} · {formatDateTime(v.createdAt)}</p>
                        {v.changeNote && <p className="text-xs text-muted-foreground">{v.changeNote}</p>}
                      </div>
                    ))}
                  </section>
                )}
              </div>
              <DialogFooter className="flex-wrap gap-2">
                {canProcessDocuments && (
                  <Button variant="outline" onClick={() => handleProcess(detailDoc.id, "OCR")}>
                    <RefreshCw className="mr-2 h-4 w-4" />Run OCR (Mock)
                  </Button>
                )}
                {canProcessDocuments && detailDoc.category === "purchase_order" && (
                  <Button variant="outline" onClick={() => handleProcess(detailDoc.id, "AI_EXTRACTION")}>
                    Extract (Mock)
                  </Button>
                )}
                {canApproveDocuments && detailDoc.status === "REQUIRES_REVIEW" && (
                  <>
                    <Button onClick={() => handleApprove(detailDoc.id)}>Approve</Button>
                    <Button variant="destructive" onClick={() => handleReject(detailDoc.id)}>Reject</Button>
                  </>
                )}
                {canManageDocuments && (
                  <>
                    <Button variant="outline" onClick={() => { setVersionId(detailDoc.id); setDetailId(null); }}>
                      New Version
                    </Button>
                    <Button variant="outline" onClick={() => handleArchive(detailDoc.id)}>
                      <Archive className="mr-2 h-4 w-4" />Archive
                    </Button>
                    {canDeleteDocuments && (
                      <Button variant="destructive" onClick={() => setDeleteId(detailDoc.id)}>
                        <Trash2 className="mr-2 h-4 w-4" />Delete
                      </Button>
                    )}
                  </>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!versionId} onOpenChange={() => setVersionId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Version</DialogTitle>
            <DialogDescription>Upload a replacement file (metadata only in mock mode).</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input type="file" onChange={(e) => setVersionFile(e.target.files?.[0] ?? null)} />
            <Textarea placeholder="Change note" value={versionNote} onChange={(e) => setVersionNote(e.target.value)} />
          </div>
          <DialogFooter>
            <SubmitButton loading={saving} onClick={handleNewVersion}>Save Version</SubmitButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!linkId} onOpenChange={() => setLinkId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link Document</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Entity type</Label>
              <Select value={linkEntityType} onValueChange={(v) => { setLinkEntityType(v as DocumentEntityType); setLinkEntityId(""); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(DOCUMENT_ENTITY_LABELS).map(([id, label]) => (
                    <SelectItem key={id} value={id}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {linkEntityType !== "none" && linkEntityType !== "organization" && (
              <div className="space-y-2">
                <Label>Entity</Label>
                <Select value={linkEntityId} onValueChange={setLinkEntityId}>
                  <SelectTrigger><SelectValue placeholder="Select entity" /></SelectTrigger>
                  <SelectContent>
                    {linkEntityOptions.map((item) => (
                      <SelectItem key={item.id} value={item.id}>{item.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <SubmitButton loading={saving} onClick={handleLink}>Save Link</SubmitButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Request document deletion?"
        description="This marks the document for deletion. Mock mode does not remove metadata immediately."
        confirmLabel="Request Delete"
        onConfirm={handleDelete}
      />
    </div>
  );
}
