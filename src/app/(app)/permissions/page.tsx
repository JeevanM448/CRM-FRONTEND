"use client";

import { useMemo, useState } from "react";
import { Shield, ShieldAlert } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PERMISSION_GROUPS,
  PERMISSION_LABELS,
  PORTAL_ROLES,
  PROTECTED_ADMIN_PERMISSIONS,
  ROLE_LABELS,
  type Permission,
  type PortalRole,
} from "@/lib/auth/permissions";
import { useCRMStore, usePermissions } from "@/store/CRMStoreProvider";
import { toast } from "sonner";

export default function PermissionsPage() {
  const { canManagePermissions } = usePermissions();
  const { getEffectiveRolePermissions, updateRolePermissions } = useCRMStore();

  const [activeRole, setActiveRole] = useState<PortalRole>("admin");
  const [draft, setDraft] = useState<Record<PortalRole, Permission[]>>(() => ({
    admin: getEffectiveRolePermissions("admin"),
    sales_manager: getEffectiveRolePermissions("sales_manager"),
    salesperson: getEffectiveRolePermissions("salesperson"),
  }));
  const [saving, setSaving] = useState(false);

  const hasChanges = useMemo(() => {
    return PORTAL_ROLES.some((role) => {
      const current = getEffectiveRolePermissions(role);
      const next = draft[role];
      if (current.length !== next.length) return true;
      const currentSet = new Set(current);
      return next.some((permission) => !currentSet.has(permission));
    });
  }, [draft, getEffectiveRolePermissions]);

  if (!canManagePermissions) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="Access restricted"
        description="Only administrators with permission management access can view this page."
      />
    );
  }

  function togglePermission(role: PortalRole, permission: Permission, checked: boolean) {
    setDraft((current) => {
      const next = new Set(current[role]);
      if (checked) next.add(permission);
      else next.delete(permission);
      if (role === "admin") {
        PROTECTED_ADMIN_PERMISSIONS.forEach((item) => next.add(item));
      }
      return { ...current, [role]: [...next] };
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      PORTAL_ROLES.forEach((role) => {
        const current = getEffectiveRolePermissions(role);
        const next = draft[role];
        const changed =
          current.length !== next.length ||
          current.some((permission) => !next.includes(permission)) ||
          next.some((permission) => !current.includes(permission));
        if (changed) {
          updateRolePermissions(role, next);
        }
      });
      toast.success("Role permissions updated");
      setDraft({
        admin: getEffectiveRolePermissions("admin"),
        sales_manager: getEffectiveRolePermissions("sales_manager"),
        salesperson: getEffectiveRolePermissions("salesperson"),
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save permissions");
    } finally {
      setSaving(false);
    }
  }

  function handleResetRole(role: PortalRole) {
    setDraft((current) => ({
      ...current,
      [role]: getEffectiveRolePermissions(role),
    }));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles & Permissions"
        description="Configure default permissions for Admin, Manager, and Salesperson portals."
        actions={
          <SubmitButton
            loading={saving}
            loadingText="Saving..."
            disabled={!hasChanges}
            onClick={handleSave}
          >
            Save changes
          </SubmitButton>
        }
      />

      <Tabs value={activeRole} onValueChange={(value) => setActiveRole(value as PortalRole)}>
        <TabsList className="grid w-full grid-cols-3">
          {PORTAL_ROLES.map((role) => (
            <TabsTrigger key={role} value={role}>
              {ROLE_LABELS[role]}
            </TabsTrigger>
          ))}
        </TabsList>

        {PORTAL_ROLES.map((role) => (
          <TabsContent key={role} value={role} className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                {draft[role].length} permissions enabled for {ROLE_LABELS[role]}.
                {role === "admin"
                  ? " Protected permissions cannot be removed from Admin."
                  : " Data scope still limits record access."}
              </p>
              <Button variant="outline" size="sm" onClick={() => handleResetRole(role)}>
                Reset unsaved changes
              </Button>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {PERMISSION_GROUPS.map((group) => (
                <Card key={`${role}-${group.id}`}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{group.label}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {group.permissions.map((permission) => {
                      const checked = draft[role].includes(permission);
                      const protectedAdmin =
                        role === "admin" && PROTECTED_ADMIN_PERMISSIONS.includes(permission);
                      return (
                        <label
                          key={permission}
                          className="flex items-start gap-3 rounded-xl border border-border p-3"
                        >
                          <Checkbox
                            checked={checked}
                            disabled={protectedAdmin}
                            onCheckedChange={(value) =>
                              togglePermission(role, permission, value === true)
                            }
                          />
                          <div className="space-y-1">
                            <Label className="text-sm font-medium leading-none">
                              {PERMISSION_LABELS[permission]}
                            </Label>
                            {protectedAdmin ? (
                              <p className="text-xs text-muted-foreground">Protected for Admin</p>
                            ) : null}
                          </div>
                        </label>
                      );
                    })}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <Card>
        <CardContent className="flex items-start gap-3 p-4 text-sm text-muted-foreground">
          <Shield className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Permissions control navigation and UI actions. They do not expand data scope — managers
            still see only their team, and salespeople still see only their own records. Permission
            changes are stored locally and recorded in Audit Logs.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
