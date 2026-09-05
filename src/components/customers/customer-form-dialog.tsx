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
import { customerService } from "@/services";
import { useCRMStore } from "@/store/CRMStoreProvider";
import { validateCustomer } from "@/lib/validation";
import type { Customer, EntityStatus } from "@/types";
import { toast } from "sonner";

interface CustomerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: Customer;
}

export function CustomerFormDialog({ open, onOpenChange, customer }: CustomerFormDialogProps) {
  const { getVisibleUsers } = useCRMStore();
  const users = getVisibleUsers();
  const [form, setForm] = useState({
    name: customer?.name ?? "",
    industry: customer?.industry ?? "",
    location: customer?.location ?? "",
    contactName: customer?.contactName ?? "",
    contactEmail: customer?.contactEmail ?? "",
    contactPhone: customer?.contactPhone ?? "",
    ownerId: customer?.ownerId ?? users[0]?.id ?? "",
    status: (customer?.status ?? "active") as EntityStatus,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validation = validateCustomer(form);
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    setLoading(true);
    try {
      if (customer) {
        await customerService.updateCustomer(customer.id, form);
        toast.success("Customer updated successfully");
      } else {
        await customerService.createCustomer(form);
        toast.success("Customer created successfully");
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
          <DialogTitle>{customer ? "Edit Customer" : "Add Customer"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Company Name *</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Industry</Label>
              <Input value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Contact Name</Label>
            <Input value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} />
              {errors.contactEmail && <p className="text-xs text-destructive">{errors.contactEmail}</p>}
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} />
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
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as EntityStatus })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
            <SubmitButton loading={loading} loadingText={customer ? "Saving..." : "Creating..."}>
              {customer ? "Save Changes" : "Create Customer"}
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
