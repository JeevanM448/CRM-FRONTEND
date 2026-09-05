"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCRMStore, useCurrentUser, usePermissions } from "@/store/CRMStoreProvider";
import { authService } from "@/services";
import { validateChangePassword } from "@/lib/validation";
import { SubmitButton } from "@/components/ui/submit-button";
import { toast } from "sonner";

export default function SettingsPage() {
  const {
    getSettings,
    updateSettings,
    resetStore,
    exportStoreData,
    getUsers,
    setCurrentUser,
  } = useCRMStore();
  const user = useCurrentUser();
  const { canManageUsers, canManageOrganization, role } = usePermissions();
  const settings = getSettings();
  const users = canManageUsers ? getUsers() : [];
  const isManager = role === "sales_manager";
  const isAdmin = role === "admin";
  const isSalesperson = role === "salesperson";

  const [profile, setProfile] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    title: user?.title ?? "",
  });
  const [company, setCompany] = useState({
    companyName: settings.companyName,
    defaultCurrency: settings.defaultCurrency,
    timezone: settings.timezone,
  });
  const [resetOpen, setResetOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);

  function saveProfile() {
    toast.success("Profile saved (demo mode — persisted in session)");
  }

  function saveCompany() {
    updateSettings(company);
    toast.success("Company settings saved");
  }

  function handleReset() {
    resetStore();
    toast.success("Demo data reset successfully");
    window.location.reload();
  }

  function handleExport() {
    const data = exportStoreData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "shiny-stone-demo-data.json";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Demo data exported");
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      toast.error("You must be signed in to change your password");
      return;
    }

    const nextErrors = validateChangePassword(passwordForm);
    setPasswordErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setPasswordSubmitting(true);
    try {
      await authService.changePassword(
        user.id,
        passwordForm.currentPassword,
        passwordForm.newPassword,
        passwordForm.confirmPassword
      );
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPasswordErrors({});
      toast.success("Password updated successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to change password");
    } finally {
      setPasswordSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={isManager ? "Manager Settings" : isSalesperson ? "My Settings" : "Settings"}
        description={
          isManager
            ? "Manage your profile, notifications, and personal preferences."
            : isSalesperson
              ? "Manage your profile, notifications, and personal preferences."
              : "Manage your profile, integrations, and platform preferences."
        }
      />

      <Tabs defaultValue="profile">
        <TabsList className="flex-wrap">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          {isAdmin ? <TabsTrigger value="company">Company</TabsTrigger> : null}
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          {isAdmin ? <TabsTrigger value="ai">AI Settings</TabsTrigger> : null}
          <TabsTrigger value="automation">Automation</TabsTrigger>
          {canManageUsers ? <TabsTrigger value="demo">Demo Tools</TabsTrigger> : null}
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Update your personal information.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>Name</Label><Input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} /></div>
              <div className="space-y-2"><Label>Email</Label><Input value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} /></div>
              <div className="space-y-2"><Label>Title</Label><Input value={profile.title} onChange={(e) => setProfile({ ...profile, title: e.target.value })} /></div>
              {canManageUsers ? (
                <div className="space-y-2 sm:col-span-2">
                  <Label>Simulate Role (frontend only)</Label>
                  <Select value={user?.id} onValueChange={(v) => { setCurrentUser(v); toast.success("Role simulation updated"); }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {users.map((u) => (
                        <SelectItem key={u.id} value={u.id}>{u.name} — {u.role}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
              <div className="sm:col-span-2"><Button onClick={saveProfile}>Save Profile</Button></div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="company">
          {canManageOrganization ? (
          <Card>
            <CardHeader><CardTitle>Company</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>Company Name</Label><Input value={company.companyName} onChange={(e) => setCompany({ ...company, companyName: e.target.value })} /></div>
              <div className="space-y-2"><Label>Default Currency</Label><Input value={company.defaultCurrency} onChange={(e) => setCompany({ ...company, defaultCurrency: e.target.value })} /></div>
              <div className="space-y-2"><Label>Timezone</Label><Input value={company.timezone} onChange={(e) => setCompany({ ...company, timezone: e.target.value })} /></div>
              <div className="sm:col-span-2"><Button onClick={saveCompany}>Save Company</Button></div>
            </CardContent>
          </Card>
          ) : null}
        </TabsContent>

        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle>Email Integration</CardTitle>
              <CardDescription>
                {isManager
                  ? "View your email integration status. Provider configuration is managed by administrators."
                  : "Connect email providers in the backend integration phase."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {["Microsoft Outlook", "Gmail"].map((provider) => (
                <div key={provider} className="flex items-center justify-between rounded-xl border border-border p-4">
                  <div>
                    <p className="font-medium">{provider}</p>
                    <p className="text-sm text-muted-foreground">Not connected — integration will be connected in backend phase</p>
                  </div>
                  <Button variant="outline" disabled>Connect</Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader><CardTitle>Notifications</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {["New deal assigned", "Follow-up reminders", "PO status changes", "Team performance alerts"].map((item) => (
                <div key={item} className="flex items-center justify-between">
                  <Label>{item}</Label>
                  <Switch defaultChecked />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security</CardTitle>
              <CardDescription>Update your sign-in password. Your current password is never displayed.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handlePasswordChange} className="space-y-4" noValidate>
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current password</Label>
                  <Input
                    id="current-password"
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    autoComplete="current-password"
                    aria-invalid={Boolean(passwordErrors.currentPassword)}
                  />
                  {passwordErrors.currentPassword ? (
                    <p className="text-xs text-destructive">{passwordErrors.currentPassword}</p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">New password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    autoComplete="new-password"
                    aria-invalid={Boolean(passwordErrors.newPassword)}
                  />
                  {passwordErrors.newPassword ? (
                    <p className="text-xs text-destructive">{passwordErrors.newPassword}</p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm new password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    autoComplete="new-password"
                    aria-invalid={Boolean(passwordErrors.confirmPassword)}
                  />
                  {passwordErrors.confirmPassword ? (
                    <p className="text-xs text-destructive">{passwordErrors.confirmPassword}</p>
                  ) : null}
                </div>
                <SubmitButton loading={passwordSubmitting} loadingText="Updating password...">
                  Update password
                </SubmitButton>
              </form>
              <Separator />
              <div className="flex items-center justify-between">
                <div><p className="font-medium">Two-factor authentication</p><p className="text-sm text-muted-foreground">Available in backend phase</p></div>
                <Switch disabled />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {isAdmin ? (
        <TabsContent value="ai">
          <Card>
            <CardHeader><CardTitle>AI Settings</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-xl border border-border p-4">
                <div><p className="font-medium">AI assistance enabled</p><p className="text-sm text-muted-foreground">Controls AI panels across email, deals, and PO</p></div>
                <Switch checked={settings.aiEnabled} onCheckedChange={(v) => { updateSettings({ aiEnabled: v }); toast.success(v ? "AI enabled" : "AI disabled"); }} />
              </div>
              <div className="flex items-center justify-between"><Label>Email classification</Label><Switch checked={settings.aiEnabled} disabled /></div>
              <div className="flex items-center justify-between"><Label>PO extraction</Label><Switch checked={settings.aiEnabled} disabled /></div>
            </CardContent>
          </Card>
        </TabsContent>
        ) : null}

        <TabsContent value="automation">
          <Card>
            <CardHeader>
              <CardTitle>Automation Preferences</CardTitle>
              <CardDescription>
                {isManager
                  ? "Personal automation preferences for your workflow. Global automation management is admin-only."
                  : isSalesperson
                    ? "Personal automation preferences for your workflow."
                    : "Configure automation behavior for your organization."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Auto-create follow-ups from emails</Label>
                <Switch checked={settings.autoFollowUp} onCheckedChange={(v) => updateSettings({ autoFollowUp: v })} />
              </div>
              <div className="flex items-center justify-between">
                <Label>Auto-link emails to deals</Label>
                <Switch checked={settings.emailAutoLink} onCheckedChange={(v) => updateSettings({ emailAutoLink: v })} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {canManageUsers ? (
        <TabsContent value="demo">
          <Card>
            <CardHeader>
              <CardTitle>Developer / Demo Tools</CardTitle>
              <CardDescription>Reset or export local demo data for backend handoff.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button variant="destructive" onClick={() => setResetOpen(true)}>Reset Demo Data</Button>
              <Button variant="outline" onClick={handleExport}>Export Demo Data</Button>
            </CardContent>
          </Card>
        </TabsContent>
        ) : null}
      </Tabs>

      <ConfirmDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        title="Reset demo data?"
        description="This will clear all localStorage data and reload seed data. This cannot be undone."
        confirmLabel="Reset"
        variant="destructive"
        onConfirm={handleReset}
      />
    </div>
  );
}
