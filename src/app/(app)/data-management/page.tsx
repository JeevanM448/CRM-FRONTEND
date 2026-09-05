"use client";

import { useMemo, useState } from "react";
import { Database, ShieldAlert, Upload } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { Label } from "@/components/ui/label";
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
import { useCRMStore, usePermissions } from "@/store/CRMStoreProvider";
import { parseCsv, downloadCsv } from "@/lib/data-management/csv";
import {
  IMPORT_TEMPLATES,
  type ExportEntityType,
  type ImportEntityType,
  type ImportPreviewResult,
} from "@/lib/data-management/import";

const EXPORT_OPTIONS: { id: ExportEntityType; label: string }[] = [
  { id: "customers", label: "Customers" },
  { id: "contacts", label: "Contacts" },
  { id: "deals", label: "Deals" },
  { id: "purchaseOrders", label: "Purchase Orders" },
  { id: "followUps", label: "Follow-ups" },
  { id: "employees", label: "Employees" },
  { id: "salesTargets", label: "Sales Targets" },
  { id: "auditLogs", label: "Audit Logs" },
];

const IMPORT_OPTIONS: { id: ImportEntityType; label: string }[] = [
  { id: "customers", label: "Customers" },
  { id: "contacts", label: "Contacts" },
  { id: "employees", label: "Employees" },
  { id: "deals", label: "Deals" },
];

export default function DataManagementPage() {
  const { canImportData, canExportData } = usePermissions();
  const { previewDataImport, exportEntityCsv, confirmDataImport } = useCRMStore();

  const [importType, setImportType] = useState<ImportEntityType>("customers");
  const [preview, setPreview] = useState<ImportPreviewResult | undefined>();
  const [importing, setImporting] = useState(false);

  const canAccess = canImportData && canExportData;

  const templateHeaders = useMemo(() => IMPORT_TEMPLATES[importType], [importType]);

  if (!canAccess) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="Access restricted"
        description="Only administrators with data import and export access can view this page."
      />
    );
  }

  async function handleFile(file: File) {
    const text = await file.text();
    const parsed = parseCsv(text);
    const result = previewDataImport(importType, parsed.rows);
    setPreview(result);
  }

  async function handleConfirmImport() {
    if (!preview) return;
    setImporting(true);
    try {
      const summary = confirmDataImport(preview);
      toast.success(
        `Imported ${summary.create + summary.update} rows (${summary.create} created, ${summary.update} updated)`
      );
      setPreview(undefined);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Import failed");
    } finally {
      setImporting(false);
    }
  }

  function handleExport(entityType: ExportEntityType) {
    try {
      const { filename, csv } = exportEntityCsv(entityType);
      downloadCsv(filename, csv);
      toast.success(`${entityType} exported`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Export failed");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Data Management"
        description="Safely import and export CRM data with preview and validation."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Export</CardTitle>
            <CardDescription>Download scoped organization data as CSV.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2">
            {EXPORT_OPTIONS.map((option) => (
              <Button key={option.id} variant="outline" onClick={() => handleExport(option.id)}>
                Export {option.label}
              </Button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Import</CardTitle>
            <CardDescription>Upload CSV, preview rows, validate, then confirm.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Data type</Label>
              <Select
                value={importType}
                onValueChange={(value) => {
                  setImportType(value as ImportEntityType);
                  setPreview(undefined);
                }}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {IMPORT_OPTIONS.map((option) => (
                    <SelectItem key={option.id} value={option.id}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Expected columns</p>
              <p>{templateHeaders.join(", ")}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="import-file">Upload CSV</Label>
              <InputFile
                id="import-file"
                onFile={(file) => {
                  void handleFile(file);
                }}
              />
            </div>

            {preview ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                  <SummaryPill label="Create" value={preview.summary.create} />
                  <SummaryPill label="Update" value={preview.summary.update} />
                  <SummaryPill label="Skip" value={preview.summary.skip} />
                  <SummaryPill label="Errors" value={preview.summary.error} />
                </div>

                <div className="max-h-72 overflow-auto rounded-xl border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Row</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Issues</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {preview.rows.slice(0, 50).map((row) => (
                        <TableRow key={row.row}>
                          <TableCell>{row.row}</TableCell>
                          <TableCell className="capitalize">{row.action}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {row.issues.map((issue) => issue.message).join("; ") || "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <SubmitButton
                  loading={importing}
                  loadingText="Importing..."
                  onClick={handleConfirmImport}
                  disabled={preview.summary.create + preview.summary.update === 0}
                >
                  Confirm Import
                </SubmitButton>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Upload className="h-4 w-4" />
                No file uploaded yet. Nothing is written until you confirm import.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="flex items-start gap-3 p-4 text-sm text-muted-foreground">
          <Database className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Imports never run until you confirm. Existing records are updated only when preview marks
            them as Update. Employee import updates safe profile fields only and does not silently
            reassign teams or managers beyond the provided CSV values.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}

function InputFile({
  id,
  onFile,
}: {
  id: string;
  onFile: (file: File) => void;
}) {
  return (
    <input
      id={id}
      type="file"
      accept=".csv,text/csv"
      className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-muted file:px-3 file:py-2"
      onChange={(event) => {
        const file = event.target.files?.[0];
        if (file) onFile(file);
      }}
    />
  );
}
