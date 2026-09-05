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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { userService } from "@/services";
import { useCRMStore, usePermissions } from "@/store/CRMStoreProvider";
import { validateSalesperson } from "@/lib/validation";
import type { EntityStatus, User } from "@/types";
import { toast } from "sonner";

interface SalespersonFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User;
  targetAmount?: number;
}

export function SalespersonFormDialog({
  open,
  onOpenChange,
  user,
  targetAmount = 0,
}: SalespersonFormDialogProps) {
  const { canCreateUsers, canEditUsers } = usePermissions();
  const { getSalesManagers, getSalespersonDetail } = useCRMStore();
  const managers = getSalesManagers();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    managerId: "",
    team: "",
    targetAmount: 0,
    status: "active" as EntityStatus,
  });

  useEffect(() => {
    if (!open) return;
    const currentManagers = getSalesManagers();
    const manager = user?.managerId
      ? currentManagers.find((item) => item.id === user.managerId)
      : undefined;
    setForm({
      name: user?.name ?? "",
      email: user?.email ?? "",
      phone: user?.phone ?? "",
      managerId: user?.managerId ?? "",
      team: user?.team ?? manager?.team ?? "",
      targetAmount: user ? (getSalespersonDetail(user.id)?.metrics.target ?? targetAmount) : 0,
      status: user?.status === "inactive" ? "inactive" : "active",
    });
    setErrors({});
  }, [
    open,
    user?.id,
    user?.name,
    user?.email,
    user?.phone,
    user?.managerId,
    user?.team,
    user?.status,
    targetAmount,
    getSalesManagers,
    getSalespersonDetail,
  ]);

  function applyManager(managerId: string) {
    if (managerId === "none") {
      setForm((current) => ({ ...current, managerId: "", team: "" }));
      return;
    }
    const manager = managers.find((item) => item.id === managerId);
    setForm((current) => ({
      ...current,
      managerId,
      team: manager?.team ?? "",
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors = validateSalesperson({
      name: form.name,
      email: form.email,
      managerId: form.managerId,
      targetAmount: form.targetAmount,
      status: form.status,
    });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    if (!canCreateUsers && !user) {
      toast.error("Only administrators can create salespeople");
      return;
    }
    if (user && !canEditUsers) {
      toast.error("Only administrators can edit salespeople");
      return;
    }

    const manager = managers.find((item) => item.id === form.managerId);
    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      role: "salesperson" as const,
      department: "Sales",
      managerId: manager ? manager.id : "",
      team: manager?.team,
      status: form.status,
      targetAmount: form.targetAmount,
    };

    setLoading(true);
    try {
      if (user) {
        await userService.updateUser(user.id, payload);
        toast.success("Salesperson updated");
      } else {
        await userService.createUser(payload);
        toast.success("Salesperson added");
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save salesperson");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{user ? "Edit salesperson" : "Add salesperson"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Full name *</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            {errors.name ? <p className="text-xs text-destructive">{errors.name}</p> : null}
          </div>
          <div className="space-y-2">
            <Label>Email *</Label>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            {errors.email ? <p className="text-xs text-destructive">{errors.email}</p> : null}
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Manager</Label>
              <Select value={form.managerId || "none"} onValueChange={applyManager}>
                <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {managers.map((manager) => (
                    <SelectItem key={manager.id} value={manager.id}>
                      {manager.name} · {manager.team ?? "No team"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Team</Label>
              <Input value={form.team || (form.managerId ? "" : "Unassigned")} readOnly />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Target *</Label>
              <Input
                type="number"
                min={0}
                value={form.targetAmount}
                onChange={(e) => setForm({ ...form, targetAmount: Number(e.target.value) })}
              />
              {errors.targetAmount ? <p className="text-xs text-destructive">{errors.targetAmount}</p> : null}
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(value) => setForm({ ...form, status: value as EntityStatus })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <SubmitButton loading={loading} loadingText="Saving...">
              {user ? "Save changes" : "Add salesperson"}
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
