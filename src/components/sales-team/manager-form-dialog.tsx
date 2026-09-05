"use client";

import { useEffect, useMemo, useState } from "react";
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
import { validateManager } from "@/lib/validation";
import type { EntityStatus, User } from "@/types";
import { toast } from "sonner";

interface ManagerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User;
}

export function ManagerFormDialog({ open, onOpenChange, user }: ManagerFormDialogProps) {
  const { canCreateUsers, canEditUsers } = usePermissions();
  const { getUsers } = useCRMStore();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    team: "",
    status: "active" as EntityStatus,
  });

  const teamOptions = useMemo(
    () =>
      [...new Set(getUsers().map((item) => item.team).filter((item): item is string => Boolean(item)))].sort(),
    [getUsers, open]
  );

  useEffect(() => {
    if (!open) return;
    setForm({
      name: user?.name ?? "",
      email: user?.email ?? "",
      phone: user?.phone ?? "",
      team: user?.team ?? "",
      status: user?.status === "inactive" ? "inactive" : "active",
    });
    setErrors({});
  }, [open, user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors = validateManager({
      name: form.name,
      email: form.email,
      team: form.team,
      status: form.status,
    });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    if (!canCreateUsers && !user) {
      toast.error("Only administrators can create managers");
      return;
    }
    if (user && !canEditUsers) {
      toast.error("Only administrators can edit managers");
      return;
    }

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      team: form.team.trim(),
      status: form.status,
      role: "sales_manager" as const,
      department: user?.department || "Sales",
    };

    setLoading(true);
    try {
      if (user) {
        await userService.updateUser(user.id, payload);
        toast.success("Manager updated");
      } else {
        await userService.createUser(payload);
        toast.success("Manager added");
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save manager");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{user ? "Edit manager" : "Add manager"}</DialogTitle>
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
              <Label>Team *</Label>
              <Input
                list={`manager-team-options-${user?.id ?? "new"}`}
                value={form.team}
                onChange={(e) => setForm({ ...form, team: e.target.value })}
                placeholder="Team C"
              />
              <datalist id={`manager-team-options-${user?.id ?? "new"}`}>
                {teamOptions.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
              {errors.team ? <p className="text-xs text-destructive">{errors.team}</p> : null}
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(value) => setForm({ ...form, status: value as EntityStatus })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
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
              {user ? "Save changes" : "Add manager"}
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
