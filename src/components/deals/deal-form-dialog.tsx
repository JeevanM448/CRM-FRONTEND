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
import { SubmitButton } from "@/components/ui/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { dealService } from "@/services";
import { useCRMStore } from "@/store/CRMStoreProvider";
import { validateDeal } from "@/lib/validation";
import type { Deal, DealStage } from "@/types";
import { toast } from "sonner";
import { delay } from "@/store/storage";

interface DealFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deal?: Deal;
  defaultCustomerId?: string;
}

export function DealFormDialog({
  open,
  onOpenChange,
  deal,
  defaultCustomerId,
}: DealFormDialogProps) {
  const { getCustomers, getVisibleUsers } = useCRMStore();
  const customers = getCustomers();
  const users = getVisibleUsers();
  const [form, setForm] = useState({
    title: deal?.title ?? "",
    customerId: deal?.customerId ?? defaultCustomerId ?? "",
    value: deal?.value ?? 0,
    ownerId: deal?.ownerId ?? users[0]?.id ?? "",
    stage: (deal?.stage ?? "new") as DealStage,
    probability: deal?.probability ?? 25,
    expectedClose: deal?.expectedClose ?? "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validation = validateDeal(form);
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    setLoading(true);
    await delay(200);

    try {
      if (deal) {
        await dealService.updateDeal(deal.id, form);
        toast.success("Deal updated successfully");
      } else {
        await dealService.createDeal(form);
        toast.success("Deal created successfully");
      }
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{deal ? "Edit Deal" : "New Deal"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Deal Title *</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
          </div>
          <div className="space-y-2">
            <Label>Customer *</Label>
            <Select value={form.customerId} onValueChange={(v) => setForm({ ...form, customerId: v })}>
              <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
              <SelectContent>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.customerId && <p className="text-xs text-destructive">{errors.customerId}</p>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Value (₹)</Label>
              <Input type="number" value={form.value} onChange={(e) => setForm({ ...form, value: Number(e.target.value) })} />
              {errors.value && <p className="text-xs text-destructive">{errors.value}</p>}
            </div>
            <div className="space-y-2">
              <Label>Probability (%)</Label>
              <Input type="number" min={0} max={100} value={form.probability} onChange={(e) => setForm({ ...form, probability: Number(e.target.value) })} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Owner</Label>
              <Select value={form.ownerId} onValueChange={(v) => setForm({ ...form, ownerId: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {users.filter((u) => u.status === "active").map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Stage</Label>
              <Select value={form.stage} onValueChange={(v) => setForm({ ...form, stage: v as DealStage })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(["new", "qualified", "quotation", "negotiation", "won", "lost"] as DealStage[]).map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Expected Close Date *</Label>
            <Input type="date" value={form.expectedClose} onChange={(e) => setForm({ ...form, expectedClose: e.target.value })} />
            {errors.expectedClose && <p className="text-xs text-destructive">{errors.expectedClose}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
            <SubmitButton loading={loading} loadingText={deal ? "Saving..." : "Creating..."}>
              {deal ? "Save Changes" : "Create Deal"}
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
