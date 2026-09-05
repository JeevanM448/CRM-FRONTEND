"use client";

import { notFound, useRouter } from "next/navigation";
import { use, useState } from "react";
import { FileText, Sparkles, Trash2, ShieldAlert } from "lucide-react";
import { useCRMStore, usePermissions } from "@/store/CRMStoreProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Progress } from "@/components/ui/progress";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/utils";
import { extractPOFields } from "@/services/mock/aiService";
import type { POStatus } from "@/types";
import { toast } from "sonner";

export default function PODetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { getPurchaseOrder, getPurchaseOrderAccessStatus, updatePurchaseOrder, deletePurchaseOrder } = useCRMStore();
  const { canEdit } = usePermissions();

  const access = getPurchaseOrderAccessStatus(id);
  const po = access === "allowed" ? getPurchaseOrder(id) : undefined;

  const [fields, setFields] = useState({
    poNumber: po?.poNumber ?? "",
    customer: po?.customerName ?? "",
    amount: String(po?.amount ?? 0),
    deliveryDate: po?.deliveryDate ?? "",
    tax: String(po?.tax ?? 0),
    total: String(po?.total ?? po?.amount ?? 0),
    status: po?.status ?? "pending",
  });
  const [confidence, setConfidence] = useState(po?.aiConfidence ?? 0);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (access === "denied") {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="Access restricted"
        description="This purchase order is outside your team scope. This is a frontend navigation check only, not production authorization."
        actionLabel="Back to Purchase Orders"
        onAction={() => router.push("/purchase-orders")}
      />
    );
  }

  if (!po) notFound();

  const purchaseOrder = po;

  function handleExtract() {
    const extracted = extractPOFields({
      poNumber: fields.poNumber,
      customerName: fields.customer,
      amount: Number(fields.amount),
      deliveryDate: fields.deliveryDate,
      items: purchaseOrder.items,
    });
    setFields({
      poNumber: extracted.poNumber,
      customer: extracted.customer,
      amount: String(extracted.amount),
      deliveryDate: extracted.deliveryDate,
      tax: String(extracted.tax),
      total: String(extracted.total),
      status: fields.status,
    });
    setConfidence(extracted.confidence);
    toast.success("Information extracted — please review fields");
  }

  function handleSave() {
    updatePurchaseOrder(id, {
      poNumber: fields.poNumber,
      amount: Number(fields.amount),
      deliveryDate: fields.deliveryDate,
      status: fields.status as POStatus,
      tax: Number(fields.tax),
      total: Number(fields.total),
      aiConfidence: confidence,
    });
    toast.success("PO details saved");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{purchaseOrder.poNumber}</h1>
          <p className="text-muted-foreground">{purchaseOrder.customerName} · {purchaseOrder.dealTitle}</p>
          <div className="mt-2 flex items-center gap-3">
            <span className="text-xl font-bold">{formatCurrency(purchaseOrder.amount)}</span>
            <StatusBadge status={purchaseOrder.status} type="po" />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            PO Date: {formatDate(purchaseOrder.poDate)} · Delivery: {formatDate(purchaseOrder.deliveryDate)}
          </p>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <Button variant="outline">
              <FileText className="h-4 w-4" />
              {purchaseOrder.documentName ?? "Document preview"}
            </Button>
            <Button variant="ghost" className="text-destructive" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Document Preview</CardTitle></CardHeader>
          <CardContent>
            <div className="flex aspect-[4/3] items-center justify-center rounded-xl border border-dashed border-border bg-muted/30">
              <div className="text-center text-muted-foreground">
                <FileText className="mx-auto h-12 w-12 opacity-40" />
                <p className="mt-2 text-sm">{purchaseOrder.documentName ?? `${purchaseOrder.poNumber}.pdf`}</p>
                {purchaseOrder.documentSize && <p className="text-xs">{Math.round(purchaseOrder.documentSize / 1024)} KB</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-ai">
              <Sparkles className="h-4 w-4" />
              ✦ AI Extracted Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {confidence > 0 && (
              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">AI Extraction Confidence</span>
                  <span className="font-semibold">{confidence}%</span>
                </div>
                <Progress value={confidence} className="h-2" indicatorClassName="bg-ai" />
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>PO Number</Label>
                <Input value={fields.poNumber} onChange={(e) => setFields({ ...fields, poNumber: e.target.value })} disabled={!canEdit} />
              </div>
              <div className="space-y-2">
                <Label>Customer</Label>
                <Input value={fields.customer} onChange={(e) => setFields({ ...fields, customer: e.target.value })} disabled={!canEdit} />
              </div>
              <div className="space-y-2">
                <Label>Amount</Label>
                <Input value={fields.amount} onChange={(e) => setFields({ ...fields, amount: e.target.value })} disabled={!canEdit} />
              </div>
              <div className="space-y-2">
                <Label>Delivery Date</Label>
                <Input value={fields.deliveryDate} onChange={(e) => setFields({ ...fields, deliveryDate: e.target.value })} disabled={!canEdit} />
              </div>
              <div className="space-y-2">
                <Label>Tax</Label>
                <Input value={fields.tax} onChange={(e) => setFields({ ...fields, tax: e.target.value })} disabled={!canEdit} />
              </div>
              <div className="space-y-2">
                <Label>Total</Label>
                <Input value={fields.total} onChange={(e) => setFields({ ...fields, total: e.target.value })} disabled={!canEdit} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Status</Label>
                <Select value={fields.status} onValueChange={(v) => setFields({ ...fields, status: v as POStatus })} disabled={!canEdit}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(["pending", "received", "approved", "processing", "completed", "cancelled"] as POStatus[]).map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {canEdit && (
              <div className="flex flex-wrap gap-2">
                <Button variant="ai" onClick={handleExtract}>Extract Information</Button>
                <Button variant="outline" onClick={handleExtract}>Reset</Button>
                <Button onClick={handleSave}>Save Changes</Button>
              </div>
            )}
            <p className="text-xs text-muted-foreground">All extracted fields are reviewable and editable before saving.</p>
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete purchase order?"
        description="This PO will be removed from tracking."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => {
          deletePurchaseOrder(id);
          toast.success("PO deleted successfully");
          router.push("/purchase-orders");
        }}
      />
    </div>
  );
}
