"use client";

import { useMemo, useState } from "react";
import { Mail, Plug, RefreshCw, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { KpiCard } from "@/components/ui/kpi-card";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SubmitButton } from "@/components/ui/submit-button";
import { useCRMStore, usePermissions } from "@/store/CRMStoreProvider";
import { emailIntegrationService } from "@/services";
import {
  EMAIL_PROVIDER_LABELS,
  EMAIL_SYNC_DIRECTION_LABELS,
  EMAIL_SYNC_FREQUENCY_LABELS,
} from "@/store/emailIntegrations";
import { formatDateTime } from "@/lib/utils";
import type { EmailIntegrationRecord, EmailProvider, EmailSyncFrequency } from "@/store/types";

function statusBadge(status: EmailIntegrationRecord["status"]) {
  if (status === "connected") return "active";
  if (status === "error") return "inactive";
  if (status === "connecting") return "pending";
  return "inactive";
}

function syncStatusLabel(status: EmailIntegrationRecord["lastSyncStatus"]) {
  if (status === "success") return "Success";
  if (status === "failed") return "Failed";
  if (status === "in_progress") return "Syncing";
  return "Idle";
}

export default function EmailIntegrationsPage() {
  const { canManageEmailIntegrations, canManageEmailSync } = usePermissions();
  const {
    getEmailIntegrations,
    getEmailIntegrationSummaryView,
    getEmailSyncRuns,
  } = useCRMStore();

  const integrations = getEmailIntegrations();
  const summary = getEmailIntegrationSummaryView();

  const [connectOpen, setConnectOpen] = useState(false);
  const [connectProvider, setConnectProvider] = useState<EmailProvider>("gmail");
  const [configureId, setConfigureId] = useState<string | undefined>();
  const [historyId, setHistoryId] = useState<string | undefined>();
  const [detailsId, setDetailsId] = useState<string | undefined>();
  const [disconnectId, setDisconnectId] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);
  const [syncingId, setSyncingId] = useState<string | undefined>();

  const [configForm, setConfigForm] = useState({
    syncEnabled: true,
    syncFrequency: "1h" as EmailSyncFrequency,
    syncDirection: "two-way" as EmailIntegrationRecord["syncDirection"],
    historicalSyncDays: 30,
    displayName: "",
  });

  const configuring = useMemo(
    () => integrations.find((item) => item.id === configureId),
    [configureId, integrations]
  );
  const historyRuns = historyId ? getEmailSyncRuns(historyId) : [];
  const details = useMemo(
    () => integrations.find((item) => item.id === detailsId),
    [detailsId, integrations]
  );

  if (!canManageEmailIntegrations) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="Access restricted"
        description="Only administrators with email integration management access can view this page."
      />
    );
  }

  function openConfigure(integration: EmailIntegrationRecord) {
    setConfigureId(integration.id);
    setConfigForm({
      syncEnabled: integration.syncEnabled,
      syncFrequency: integration.syncFrequency,
      syncDirection: integration.syncDirection,
      historicalSyncDays: integration.historicalSyncDays ?? 30,
      displayName: integration.displayName,
    });
  }

  async function handleConnect() {
    setSaving(true);
    try {
      await emailIntegrationService.connectProvider({
        provider: connectProvider,
        accountEmail:
          connectProvider === "gmail" ? "sales@shinystone.com" : "crm@shinystone.com",
        displayName:
          connectProvider === "gmail" ? "Shiny Stone Sales" : "Shiny Stone CRM",
      });
      toast.success(`${EMAIL_PROVIDER_LABELS[connectProvider]} connected (mock)`);
      setConnectOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Connection failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDisconnect() {
    if (!disconnectId) return;
    setSaving(true);
    try {
      await emailIntegrationService.disconnectIntegration(disconnectId);
      toast.success("Integration disconnected");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Disconnect failed");
    } finally {
      setSaving(false);
      setDisconnectId(undefined);
    }
  }

  async function handleReconnect(id: string) {
    setSaving(true);
    try {
      await emailIntegrationService.reconnectIntegration(id);
      toast.success("Integration reconnected (mock)");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Reconnect failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveConfig() {
    if (!configureId) return;
    setSaving(true);
    try {
      await emailIntegrationService.updateIntegration(configureId, configForm);
      toast.success("Integration settings saved");
      setConfigureId(undefined);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleSync(id: string) {
    if (!canManageEmailSync) {
      toast.error("You do not have permission to run email sync");
      return;
    }
    setSyncingId(id);
    try {
      const run = await emailIntegrationService.syncIntegration(id);
      toast.success(
        `Sync complete: ${run.messagesCreated} created, ${run.messagesUpdated} updated`
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sync failed");
    } finally {
      setSyncingId(undefined);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Email Integrations"
        description="Manage organization email provider connections, sync settings, and integration health."
        actions={
          <Button variant="accent" onClick={() => setConnectOpen(true)}>
            <Plug className="mr-2 h-4 w-4" />
            Connect Account
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Connected Accounts" value={String(summary.connectedCount)} />
        <KpiCard label="Gmail Accounts" value={String(summary.gmailCount)} />
        <KpiCard label="Outlook Accounts" value={String(summary.outlookCount)} />
        <KpiCard label="Sync Issues" value={String(summary.syncIssueCount)} featured />
      </div>

      <Card>
        <CardContent className="flex items-start gap-3 p-4 text-sm text-muted-foreground">
          <Mail className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Mock development mode: connections simulate OAuth without real provider credentials.
            Production will use secure backend OAuth, server-side token storage, and background sync
            workers. Historical CRM emails in Inbox are preserved when integrations disconnect.
          </p>
        </CardContent>
      </Card>

      {integrations.length === 0 ? (
        <EmptyState
          icon={Mail}
          title="No email integrations"
          description="Connect Gmail or Microsoft Outlook to prepare for organization-wide email sync."
          actionLabel="Connect Account"
          onAction={() => setConnectOpen(true)}
        />
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {integrations.map((integration) => (
              <IntegrationCard
                key={integration.id}
                integration={integration}
                syncing={syncingId === integration.id}
                canSync={canManageEmailSync}
                onConfigure={() => openConfigure(integration)}
                onSync={() => handleSync(integration.id)}
                onDisconnect={() => setDisconnectId(integration.id)}
                onReconnect={() => handleReconnect(integration.id)}
                onHistory={() => setHistoryId(integration.id)}
                onDetails={() => setDetailsId(integration.id)}
              />
            ))}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Provider</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sync</TableHead>
                  <TableHead>Last Sync</TableHead>
                  <TableHead>Connected</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {integrations.map((integration) => (
                  <TableRow key={integration.id}>
                    <TableCell>{EMAIL_PROVIDER_LABELS[integration.provider]}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{integration.displayName}</p>
                        <p className="text-xs text-muted-foreground">{integration.accountEmail}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={statusBadge(integration.status)} />
                    </TableCell>
                    <TableCell>
                      {integration.syncEnabled ? "Enabled" : "Disabled"}
                      <p className="text-xs text-muted-foreground">
                        {syncStatusLabel(integration.lastSyncStatus)}
                      </p>
                    </TableCell>
                    <TableCell>
                      {integration.lastSyncAt
                        ? formatDateTime(integration.lastSyncAt)
                        : "—"}
                    </TableCell>
                    <TableCell>
                      {integration.connectedAt
                        ? formatDateTime(integration.connectedAt)
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <IntegrationActions
                        integration={integration}
                        syncing={syncingId === integration.id}
                        canSync={canManageEmailSync}
                        onConfigure={() => openConfigure(integration)}
                        onSync={() => handleSync(integration.id)}
                        onDisconnect={() => setDisconnectId(integration.id)}
                        onReconnect={() => handleReconnect(integration.id)}
                        onHistory={() => setHistoryId(integration.id)}
                        onDetails={() => setDetailsId(integration.id)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      <Dialog open={connectOpen} onOpenChange={setConnectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect Email Account</DialogTitle>
            <DialogDescription>
              In production, this launches secure OAuth through the backend. The mock flow creates
              a development integration record only — no real provider authorization occurs.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Provider</Label>
              <Select
                value={connectProvider}
                onValueChange={(value) => setConnectProvider(value as EmailProvider)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="gmail">Gmail (Google Workspace)</SelectItem>
                  <SelectItem value="outlook">Microsoft Outlook / Microsoft 365</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-xl border border-dashed border-border p-3 text-sm text-muted-foreground">
              OAuth tokens, refresh tokens, and client secrets are stored server-side in production.
              They are never written to browser localStorage.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConnectOpen(false)}>Cancel</Button>
            <SubmitButton loading={saving} onClick={handleConnect}>
              Connect (Mock)
            </SubmitButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(configureId)} onOpenChange={(open) => !open && setConfigureId(undefined)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configure Integration</DialogTitle>
            <DialogDescription>
              {configuring
                ? `${EMAIL_PROVIDER_LABELS[configuring.provider]} · ${configuring.accountEmail}`
                : "Sync settings"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Display name</Label>
              <Input
                value={configForm.displayName}
                onChange={(e) => setConfigForm({ ...configForm, displayName: e.target.value })}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Sync frequency</Label>
                <Select
                  value={configForm.syncFrequency}
                  onValueChange={(value) =>
                    setConfigForm({ ...configForm, syncFrequency: value as EmailSyncFrequency })
                  }
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(EMAIL_SYNC_FREQUENCY_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Sync direction</Label>
                <Select
                  value={configForm.syncDirection}
                  onValueChange={(value) =>
                    setConfigForm({
                      ...configForm,
                      syncDirection: value as EmailIntegrationRecord["syncDirection"],
                    })
                  }
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(EMAIL_SYNC_DIRECTION_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Historical sync period (days)</Label>
              <Input
                type="number"
                min={1}
                max={365}
                value={configForm.historicalSyncDays}
                onChange={(e) =>
                  setConfigForm({
                    ...configForm,
                    historicalSyncDays: Number(e.target.value),
                  })
                }
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                id="sync-enabled"
                type="checkbox"
                checked={configForm.syncEnabled}
                onChange={(e) =>
                  setConfigForm({ ...configForm, syncEnabled: e.target.checked })
                }
              />
              <Label htmlFor="sync-enabled">Sync enabled</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfigureId(undefined)}>Cancel</Button>
            <SubmitButton loading={saving} onClick={handleSaveConfig}>Save Settings</SubmitButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(historyId)} onOpenChange={(open) => !open && setHistoryId(undefined)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Sync History</DialogTitle>
            <DialogDescription>Recent sync runs for this integration.</DialogDescription>
          </DialogHeader>
          {historyRuns.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sync runs yet.</p>
          ) : (
            <div className="max-h-80 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Started</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Processed</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead>Errors</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historyRuns.map((run) => (
                    <TableRow key={run.id}>
                      <TableCell>{formatDateTime(run.startedAt)}</TableCell>
                      <TableCell className="capitalize">{run.status}</TableCell>
                      <TableCell>{run.messagesProcessed}</TableCell>
                      <TableCell>{run.messagesCreated}</TableCell>
                      <TableCell>{run.messagesUpdated}</TableCell>
                      <TableCell>{run.errorCount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(detailsId)} onOpenChange={(open) => !open && setDetailsId(undefined)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Integration Details</DialogTitle>
          </DialogHeader>
          {details ? (
            <div className="space-y-2 text-sm">
              <p><strong>Provider:</strong> {EMAIL_PROVIDER_LABELS[details.provider]}</p>
              <p><strong>Account:</strong> {details.accountEmail}</p>
              <p><strong>Connection:</strong> {details.connectionType.toUpperCase()} (mock)</p>
              <p><strong>Status:</strong> {details.status}</p>
              <p><strong>Sync direction:</strong> {EMAIL_SYNC_DIRECTION_LABELS[details.syncDirection]}</p>
              <p><strong>AI classification:</strong> {details.metadata?.aiClassificationEnabled ? "Ready" : "Off"}</p>
              <p><strong>Automation triggers:</strong> {details.metadata?.automationTriggersEnabled ? "Ready" : "Off"}</p>
              {details.lastSyncError ? (
                <p className="text-destructive"><strong>Last error:</strong> {details.lastSyncError}</p>
              ) : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(disconnectId)}
        onOpenChange={(open) => !open && setDisconnectId(undefined)}
        title="Disconnect email integration?"
        description="This stops synchronization and deactivates the connection. Historical CRM email records in Inbox are preserved. Production will revoke provider authorization where supported."
        confirmLabel="Disconnect"
        variant="destructive"
        onConfirm={handleDisconnect}
      />
    </div>
  );
}

function IntegrationActions({
  integration,
  syncing,
  canSync,
  onConfigure,
  onSync,
  onDisconnect,
  onReconnect,
  onHistory,
  onDetails,
}: {
  integration: EmailIntegrationRecord;
  syncing: boolean;
  canSync: boolean;
  onConfigure: () => void;
  onSync: () => void;
  onDisconnect: () => void;
  onReconnect: () => void;
  onHistory: () => void;
  onDetails: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {integration.status === "disconnected" ? (
        <Button variant="outline" size="sm" onClick={onReconnect}>Reconnect</Button>
      ) : (
        <>
          {canSync ? (
            <Button variant="outline" size="sm" onClick={onSync} disabled={syncing}>
              <RefreshCw className={`mr-1 h-3 w-3 ${syncing ? "animate-spin" : ""}`} />
              Sync Now
            </Button>
          ) : null}
          <Button variant="outline" size="sm" onClick={onConfigure}>Configure</Button>
          <Button variant="outline" size="sm" onClick={onDisconnect}>Disconnect</Button>
        </>
      )}
      <Button variant="ghost" size="sm" onClick={onHistory}>History</Button>
      <Button variant="ghost" size="sm" onClick={onDetails}>Details</Button>
    </div>
  );
}

function IntegrationCard({
  integration,
  syncing,
  canSync,
  onConfigure,
  onSync,
  onDisconnect,
  onReconnect,
  onHistory,
  onDetails,
}: {
  integration: EmailIntegrationRecord;
  syncing: boolean;
  canSync: boolean;
  onConfigure: () => void;
  onSync: () => void;
  onDisconnect: () => void;
  onReconnect: () => void;
  onHistory: () => void;
  onDetails: () => void;
}) {
  return (
    <Card className="p-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="font-medium">{EMAIL_PROVIDER_LABELS[integration.provider]}</p>
          <StatusBadge status={statusBadge(integration.status)} />
        </div>
        <p className="text-sm">{integration.displayName}</p>
        <p className="text-xs text-muted-foreground">{integration.accountEmail}</p>
        <p className="text-sm text-muted-foreground">
          Last sync: {integration.lastSyncAt ? formatDateTime(integration.lastSyncAt) : "—"}
        </p>
        <IntegrationActions
          integration={integration}
          syncing={syncing}
          canSync={canSync}
          onConfigure={onConfigure}
          onSync={onSync}
          onDisconnect={onDisconnect}
          onReconnect={onReconnect}
          onHistory={onHistory}
          onDetails={onDetails}
        />
      </div>
    </Card>
  );
}
