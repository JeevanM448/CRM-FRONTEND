"use client";

import { useEffect, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCRMStore } from "@/store/CRMStoreProvider";
import { emailService, followUpService } from "@/services";
import { toast } from "sonner";
import type { Priority } from "@/types";

interface ComposeEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultCustomerId?: string;
  defaultDealId?: string;
  defaultTo?: string;
  defaultSubject?: string;
  defaultBody?: string;
}

export function ComposeEmailDialog({
  open,
  onOpenChange,
  defaultCustomerId,
  defaultDealId,
  defaultTo,
  defaultSubject,
  defaultBody,
}: ComposeEmailDialogProps) {
  const { getCustomers, getDeals } = useCRMStore();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    to: defaultTo ?? "",
    subject: defaultSubject ?? "",
    body: defaultBody ?? "",
    customerId: defaultCustomerId ?? "",
    dealId: defaultDealId ?? "",
  });

  useEffect(() => {
    if (open) {
      setForm({
        to: defaultTo ?? "",
        subject: defaultSubject ?? "",
        body: defaultBody ?? "",
        customerId: defaultCustomerId ?? "",
        dealId: defaultDealId ?? "",
      });
    }
  }, [open, defaultTo, defaultSubject, defaultBody, defaultCustomerId, defaultDealId]);

  async function handleSend() {
    if (!form.to || !form.subject) {
      toast.error("To and Subject are required");
      return;
    }
    setLoading(true);
    try {
      await emailService.sendEmail(form);
      toast.success("Email sent successfully");
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  }

  async function handleDraft() {
    setLoading(true);
    try {
      await emailService.saveDraft(form);
      toast.success("Email saved as draft");
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Compose Email</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>To</Label>
            <Input value={form.to} onChange={(e) => setForm({ ...form, to: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Subject</Label>
            <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Customer</Label>
              <Select value={form.customerId} onValueChange={(v) => setForm({ ...form, customerId: v })}>
                <SelectTrigger><SelectValue placeholder="Link customer" /></SelectTrigger>
                <SelectContent>
                  {getCustomers().map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Deal</Label>
              <Select value={form.dealId} onValueChange={(v) => setForm({ ...form, dealId: v })}>
                <SelectTrigger><SelectValue placeholder="Link deal" /></SelectTrigger>
                <SelectContent>
                  {getDeals().map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Message</Label>
            <Textarea className="min-h-[160px]" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleDraft} disabled={loading}>Save Draft</Button>
            <SubmitButton type="button" variant="accent" loading={loading} loadingText="Sending..." onClick={handleSend}>
              Send
            </SubmitButton>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface FollowUpFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultCustomerId?: string;
  defaultDealId?: string;
  followUpId?: string;
  initialValues?: {
    title?: string;
    description?: string;
    dueDate?: string;
    priority?: Priority;
  };
}

export function FollowUpFormDialog({
  open,
  onOpenChange,
  defaultCustomerId,
  defaultDealId,
  followUpId,
  initialValues,
}: FollowUpFormDialogProps) {
  const { getCustomers, getDeals, getCurrentUser, getFollowUps, getVisibleUsers } = useCRMStore();
  const user = getCurrentUser();
  const existing = followUpId ? getFollowUps().find((f) => f.id === followUpId) : undefined;
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    customerId: defaultCustomerId ?? "",
    dealId: defaultDealId ?? "",
    dueDate: "",
    priority: "medium" as Priority,
    ownerId: user?.id ?? "",
  });

  useEffect(() => {
    if (open) {
      setForm({
        title: initialValues?.title ?? existing?.title ?? "",
        description: initialValues?.description ?? existing?.description ?? "",
        customerId: defaultCustomerId ?? existing?.customerId ?? "",
        dealId: defaultDealId ?? existing?.dealId ?? "",
        dueDate: (initialValues?.dueDate ?? existing?.dueDate ?? "").slice(0, 16),
        priority: initialValues?.priority ?? existing?.priority ?? "medium",
        ownerId: existing?.ownerId ?? user?.id ?? "",
      });
    }
  }, [open, followUpId, defaultCustomerId, defaultDealId, initialValues, existing, user?.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.customerId || !form.dealId || !form.dueDate) {
      toast.error("Please fill all required fields");
      return;
    }
    setLoading(true);
    try {
      const dueDate = new Date(form.dueDate).toISOString();
      if (followUpId) {
        await followUpService.updateFollowUp(followUpId, { ...form, dueDate });
        toast.success("Follow-up updated successfully");
      } else {
        await followUpService.createFollowUp({ ...form, dueDate });
        toast.success("Follow-up created successfully");
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
          <DialogTitle>{followUpId ? "Edit Follow-up" : "Create Follow-up"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Title *</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Customer *</Label>
              <Select value={form.customerId} onValueChange={(v) => setForm({ ...form, customerId: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
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
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {getDeals().map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Due Date *</Label>
              <Input type="datetime-local" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v as Priority })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Assigned to</Label>
            <Select value={form.ownerId} onValueChange={(v) => setForm({ ...form, ownerId: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {getVisibleUsers().map((u) => (
                  <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
            <SubmitButton loading={loading} loadingText={followUpId ? "Saving..." : "Creating..."}>
              {followUpId ? "Save Changes" : "Create Follow-up"}
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
