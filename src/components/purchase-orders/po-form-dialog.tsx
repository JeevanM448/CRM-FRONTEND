"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCRMStore } from "@/store/CRMStoreProvider";
import type { POStatus } from "@/types";
import { toast } from "sonner";

interface POFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function POFormDialog({ open, onOpenChange }: POFormDialogProps) {
  const { createPurchaseOrder, getCustomers, getDeals, getCurrentUser } = useCRMStore();
  const user = getCurrentUser();
  const [form, setForm] = useState({
    poNumber: "",
    customerId: "",
    dealId: "",
    amount: 0,
    poDate: new Date().toISOString().slice(0, 10),
    deliveryDate: "",
    status: "pending" as POStatus,
    ownerId: user?.id ?? "",
  });
  const [fileMeta, setFileMeta] = useState<{ name: string; size: number; type: string } | null>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setFileMeta({ name: file.name, size: file.size, type: file.type });
      if (!form.poNumber) {
        setForm((f) => ({ ...f, poNumber: file.name.replace(/\.[^.]+$/, "").toUpperCase() }));
      }
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.poNumber || !form.customerId || !form.dealId) {
      toast.error("PO Number, Customer, and Deal are required");
      return;
    }
    createPurchaseOrder({
      ...form,
      documentName: fileMeta?.name,
      documentSize: fileMeta?.size,
      documentType: fileMeta?.type,
    });
    toast.success("PO uploaded successfully");
    onOpenChange(false);
  }

  const customerDeals = form.customerId
    ? getDeals().filter((d) => d.customerId === form.customerId)
    : getDeals();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Upload Purchase Order</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Document</Label>
            <Input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={handleFile} />
            {fileMeta && (
              <p className="text-xs text-muted-foreground">
                {fileMeta.name} ({Math.round(fileMeta.size / 1024)} KB)
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label>PO Number *</Label>
            <Input value={form.poNumber} onChange={(e) => setForm({ ...form, poNumber: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Customer *</Label>
            <Select value={form.customerId} onValueChange={(v) => setForm({ ...form, customerId: v, dealId: "" })}>
              <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
              <SelectContent>
                {getCustomers().map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Deal *</Label>
            <Select value={form.dealId} onValueChange={(v) => setForm({ ...form, dealId: v })}>
              <SelectTrigger><SelectValue placeholder="Select deal" /></SelectTrigger>
              <SelectContent>
                {customerDeals.map((d) => (
                  <SelectItem key={d.id} value={d.id}>{d.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Amount (₹)</Label>
              <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as POStatus })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(["pending", "received", "approved", "processing", "completed", "cancelled"] as POStatus[]).map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>PO Date</Label>
              <Input type="date" value={form.poDate} onChange={(e) => setForm({ ...form, poDate: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Delivery Date</Label>
              <Input type="date" value={form.deliveryDate} onChange={(e) => setForm({ ...form, deliveryDate: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">Upload PO</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
