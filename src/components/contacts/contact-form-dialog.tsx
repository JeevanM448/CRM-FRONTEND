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
import { contactService } from "@/services";
import { useCRMStore } from "@/store/CRMStoreProvider";
import { validateContact } from "@/lib/validation";
import type { Contact, EntityStatus } from "@/types";
import { toast } from "sonner";
import { delay } from "@/store/storage";

interface ContactFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact?: Contact;
  defaultCustomerId?: string;
}

export function ContactFormDialog({
  open,
  onOpenChange,
  contact,
  defaultCustomerId,
}: ContactFormDialogProps) {
  const { getCustomers, getVisibleUsers } = useCRMStore();
  const customers = getCustomers();
  const users = getVisibleUsers();
  const [form, setForm] = useState({
    name: contact?.name ?? "",
    companyId: contact?.companyId ?? defaultCustomerId ?? "",
    designation: contact?.designation ?? "",
    email: contact?.email ?? "",
    phone: contact?.phone ?? "",
    ownerId: contact?.ownerId ?? users[0]?.id ?? "",
    status: (contact?.status ?? "active") as EntityStatus,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validation = validateContact(form);
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    setLoading(true);
    await delay(200);

    try {
      if (contact) {
        await contactService.updateContact(contact.id, form);
        toast.success("Contact updated successfully");
      } else {
        await contactService.createContact(form);
        toast.success("Contact created successfully");
      }
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{contact ? "Edit Contact" : "Add Contact"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Name *</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>
          <div className="space-y-2">
            <Label>Customer *</Label>
            <Select value={form.companyId} onValueChange={(v) => setForm({ ...form, companyId: v })}>
              <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
              <SelectContent>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.companyId && <p className="text-xs text-destructive">{errors.companyId}</p>}
          </div>
          <div className="space-y-2">
            <Label>Designation</Label>
            <Input value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
            <SubmitButton loading={loading} loadingText={contact ? "Saving..." : "Creating..."}>
              {contact ? "Save" : "Create Contact"}
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
