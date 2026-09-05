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
import { Separator } from "@/components/ui/separator";
import { authService, userService } from "@/services";
import { useCRMStore, usePermissions } from "@/store/CRMStoreProvider";
import { validateManager, validateSignInAccount } from "@/lib/validation";
import type { AccountStatus } from "@/types/account";
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
    signInEmail: "",
    password: "",
    confirmPassword: "",
    accountStatus: "active" as AccountStatus,
  });

  const teamOptions = useMemo(
    () =>
      [...new Set(getUsers().map((item) => item.team).filter((item): item is string => Boolean(item)))].sort(),
    [getUsers, open]
  );

  useEffect(() => {
    if (!open) return;
    async function loadForm() {
      const account = user ? await authService.getAccountForUser(user.id) : null;
      setForm({
        name: user?.name ?? "",
        email: user?.email ?? "",
        phone: user?.phone ?? "",
        team: user?.team ?? "",
        status: user?.status === "inactive" ? "inactive" : "active",
        signInEmail: account?.email ?? user?.email ?? "",
        password: "",
        confirmPassword: "",
        accountStatus: account?.status ?? "active",
      });
      setErrors({});
    }
    loadForm();
  }, [open, user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors = {
      ...validateManager({
        name: form.name,
        email: form.email,
        team: form.team,
        status: form.status,
      }),
      ...validateSignInAccount({
        signInEmail: form.signInEmail,
        password: form.password,
        confirmPassword: form.confirmPassword,
        accountStatus: form.accountStatus,
        isEdit: Boolean(user),
      }),
    };
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

    const emailAvailable = await authService.isEmailAvailable(
      form.signInEmail,
      user?.id
    );
    if (!emailAvailable) {
      setErrors((current) => ({
        ...current,
        signInEmail: "A sign-in account with this email already exists",
      }));
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
      signInEmail: form.signInEmail.trim(),
      accountStatus: form.accountStatus,
      ...(form.password.trim() ? { password: form.password } : {}),
    };

    setLoading(true);
    try {
      if (user) {
        await userService.updateUser(user.id, payload);
        toast.success("Manager updated");
      } else {
        const created = await userService.createUser({
          ...payload,
          password: form.password,
        });
        await authService.prepareAccountInvitation(created.id);
        toast.success("Manager added with sign-in account");
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
              <Label>Profile status</Label>
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

          <Separator />
          <div className="space-y-1">
            <h3 className="text-sm font-medium">Sign-in account</h3>
            <p className="text-xs text-muted-foreground">
              Credentials the manager uses on the login page. Role is assigned automatically.
            </p>
          </div>
          <div className="space-y-2">
            <Label>Sign-in email *</Label>
            <Input
              type="email"
              value={form.signInEmail}
              onChange={(e) => setForm({ ...form, signInEmail: e.target.value })}
              autoComplete="off"
            />
            {errors.signInEmail ? <p className="text-xs text-destructive">{errors.signInEmail}</p> : null}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{user ? "Set new password" : "Initial password *"}</Label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                autoComplete="new-password"
              />
              {errors.password ? <p className="text-xs text-destructive">{errors.password}</p> : null}
            </div>
            <div className="space-y-2">
              <Label>{user ? "Confirm new password" : "Confirm password *"}</Label>
              <Input
                type="password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                autoComplete="new-password"
              />
              {errors.confirmPassword ? (
                <p className="text-xs text-destructive">{errors.confirmPassword}</p>
              ) : null}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Account status</Label>
            <Select
              value={form.accountStatus}
              onValueChange={(value) => setForm({ ...form, accountStatus: value as AccountStatus })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="invited">Invited</SelectItem>
                <SelectItem value="disabled">Disabled</SelectItem>
              </SelectContent>
            </Select>
            {errors.accountStatus ? <p className="text-xs text-destructive">{errors.accountStatus}</p> : null}
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
