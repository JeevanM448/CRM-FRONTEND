"use client";

import { useEffect, useState } from "react";
import { HardDrive, RefreshCw, Shield } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { KpiCard } from "@/components/ui/kpi-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { formatDateTime } from "@/lib/utils";
import { useCRMStore, usePermissions } from "@/store/CRMStoreProvider";
import { backupService } from "@/services";
import {
  BACKUP_STATUS_LABELS,
  BACKUP_TYPE_LABELS,
  formatFileSize,
  RECOVERY_SCOPE_LABELS,
  type BackupFrequency,
  type BackupType,
} from "@/store/backups";

function readinessLabel(status: "ready" | "not_configured") {
  return status === "ready" ? "Ready" : "Not configured";
}

export default function BackupRecoveryPage() {
  const { canViewBackups, canManageBackups, canRestoreBackups } = usePermissions();
  const {
    getBackups,
    getRecoveryPoints,
    getRetentionPolicy,
    getBackupSummary,
    getBackupSecurityReadiness,
  } = useCRMStore();

  const backups = getBackups();
  const recoveryPoints = getRecoveryPoints();
  const policy = getRetentionPolicy();
  const summary = getBackupSummary();
  const security = getBackupSecurityReadiness();

  const [creating, setCreating] = useState(false);
  const [savingPolicy, setSavingPolicy] = useState(false);
  const [restoreId, setRestoreId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [policyDraft, setPolicyDraft] = useState(policy);

  useEffect(() => {
    setPolicyDraft(policy);
  }, [policy.updatedAt, policy]);

  const detailBackup = backups.find((b) => b.id === detailId);
  const restorePoint = restoreId ? recoveryPoints.find((p) => p.id === restoreId) : null;

  async function handleCreateBackup() {
    setCreating(true);
    try {
      await backupService.createBackup(policy.backupType);
      toast.success("Mock backup completed (simulation only)");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Backup failed");
    } finally {
      setCreating(false);
    }
  }

  async function handleSavePolicy() {
    setSavingPolicy(true);
    try {
      await backupService.updateRetentionPolicy(policyDraft);
      toast.success("Retention policy saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed");
    } finally {
      setSavingPolicy(false);
    }
  }

  async function handleSimulateRestore() {
    if (!restoreId) return;
    try {
      const result = await backupService.simulateRestore(restoreId);
      toast.success(result.message);
      setRestoreId(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Simulation failed");
    }
  }

  async function handleVerify(id: string) {
    try {
      await backupService.verifyBackup(id);
      toast.success("Backup verified (mock)");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Verification failed");
    }
  }

  if (!canViewBackups) {
    return (
      <EmptyState
        icon={Shield}
        title="Access restricted"
        description="Backup & recovery is available to administrators only."
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Backup & Recovery"
        description="Manage backup readiness, recovery points, and retention policies."
        actions={
          canManageBackups ? (
            <Button onClick={handleCreateBackup} disabled={creating}>
              <HardDrive className="mr-2 h-4 w-4" />
              Create Backup (Mock)
            </Button>
          ) : undefined
        }
      />

      <Card className="border-dashed border-warning/40 bg-warning/5">
        <CardContent className="flex items-start gap-3 p-4 text-sm">
          <HardDrive className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <p>
            Backups and restores are <strong>simulation only</strong>. No data is exported, copied,
            or modified. Future backend will use encrypted private storage and verified restore workflows.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard
          label="Last Successful Backup"
          value={summary.lastSuccessfulBackupAt ? formatDateTime(summary.lastSuccessfulBackupAt) : "—"}
          subValue="Mock"
        />
        <KpiCard
          label="Backup Status"
          value={summary.backupStatus === "NONE" ? "None" : BACKUP_STATUS_LABELS[summary.backupStatus as keyof typeof BACKUP_STATUS_LABELS] ?? summary.backupStatus}
        />
        <KpiCard label="Storage Used" value={formatFileSize(summary.storageUsedBytes)} subValue="Metadata estimate" />
        <KpiCard label="Recovery Points" value={String(summary.recoveryPointCount)} />
        <KpiCard label="Failed Backups" value={String(summary.failedBackupCount)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Retention Policy</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Enabled</Label>
              <Switch
                checked={policyDraft.enabled}
                onCheckedChange={(v) => setPolicyDraft({ ...policyDraft, enabled: v })}
                disabled={!canManageBackups}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Retention (days)</Label>
                <Select
                  value={String(policyDraft.retentionDays)}
                  onValueChange={(v) => setPolicyDraft({ ...policyDraft, retentionDays: Number(v) })}
                  disabled={!canManageBackups}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[7, 14, 30, 60, 90].map((d) => (
                      <SelectItem key={d} value={String(d)}>{d} days</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Frequency</Label>
                <Select
                  value={policyDraft.backupFrequency}
                  onValueChange={(v) => setPolicyDraft({ ...policyDraft, backupFrequency: v as BackupFrequency })}
                  disabled={!canManageBackups}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DAILY">Daily</SelectItem>
                    <SelectItem value="WEEKLY">Weekly</SelectItem>
                    <SelectItem value="MONTHLY">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Backup type</Label>
                <Select
                  value={policyDraft.backupType}
                  onValueChange={(v) => setPolicyDraft({ ...policyDraft, backupType: v as BackupType })}
                  disabled={!canManageBackups}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(BACKUP_TYPE_LABELS).map(([id, label]) => (
                      <SelectItem key={id} value={id}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Max recovery points</Label>
                <Select
                  value={String(policyDraft.maxRecoveryPoints)}
                  onValueChange={(v) => setPolicyDraft({ ...policyDraft, maxRecoveryPoints: Number(v) })}
                  disabled={!canManageBackups}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[5, 10, 20, 30].map((n) => (
                      <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label>Encryption required</Label>
              <Switch
                checked={policyDraft.encryptionRequired}
                onCheckedChange={(v) => setPolicyDraft({ ...policyDraft, encryptionRequired: v })}
                disabled={!canManageBackups}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Verification required</Label>
              <Switch
                checked={policyDraft.verificationRequired}
                onCheckedChange={(v) => setPolicyDraft({ ...policyDraft, verificationRequired: v })}
                disabled={!canManageBackups}
              />
            </div>
            {canManageBackups && (
              <SubmitButton loading={savingPolicy} onClick={handleSavePolicy}>Save Policy</SubmitButton>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Security Readiness</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>Encryption: {readinessLabel(security.encryption)}</p>
            <p>Integrity Verification: {readinessLabel(security.integrityVerification)}</p>
            <p>Private Storage: {readinessLabel(security.privateStorage)}</p>
            <p>Access Control: {readinessLabel(security.accessControl)}</p>
            <p>Audit Logging: {readinessLabel(security.auditLogging)}</p>
            <p className="text-xs text-muted-foreground">Indicators reflect mock configuration readiness, not production enforcement.</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Backup History</CardTitle>
          {canManageBackups && (
            <Button size="sm" variant="outline" onClick={handleCreateBackup} disabled={creating}>
              <RefreshCw className="mr-2 h-4 w-4" />Refresh
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {backups.length === 0 ? (
            <EmptyState icon={HardDrive} title="No backups" description="Create a mock backup to get started." />
          ) : (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Backup</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Completed</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {backups.map((backup) => (
                      <TableRow key={backup.id}>
                        <TableCell className="font-mono text-xs">{backup.id}</TableCell>
                        <TableCell>{BACKUP_TYPE_LABELS[backup.type]}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{BACKUP_STATUS_LABELS[backup.status]}</Badge>
                        </TableCell>
                        <TableCell>{formatFileSize(backup.sizeBytes)}</TableCell>
                        <TableCell>{formatDateTime(backup.startedAt)}</TableCell>
                        <TableCell>{backup.completedAt ? formatDateTime(backup.completedAt) : "—"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="sm" variant="ghost" onClick={() => setDetailId(backup.id)}>Details</Button>
                            {backup.status === "COMPLETED" && canManageBackups && (
                              <Button size="sm" variant="outline" onClick={() => handleVerify(backup.id)}>Verify</Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="space-y-3 lg:hidden">
                {backups.map((backup) => (
                  <Card key={backup.id}>
                    <CardContent className="space-y-2 p-4 text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium">{BACKUP_TYPE_LABELS[backup.type]}</span>
                        <Badge variant="outline">{BACKUP_STATUS_LABELS[backup.status]}</Badge>
                      </div>
                      <p className="text-muted-foreground">{formatFileSize(backup.sizeBytes)} · {formatDateTime(backup.startedAt)}</p>
                      <Button size="sm" variant="outline" onClick={() => setDetailId(backup.id)}>Details</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Recovery Points</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {recoveryPoints.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recovery points yet.</p>
          ) : (
            recoveryPoints.map((point) => (
              <div key={point.id} className="flex flex-col gap-2 rounded-md border p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">{point.description}</p>
                  <p className="text-sm text-muted-foreground">
                    {RECOVERY_SCOPE_LABELS[point.scope]} · {formatFileSize(point.sizeBytes)} · {point.integrityStatus}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(point.createdAt)}</p>
                </div>
                {canRestoreBackups && point.restorable && (
                  <Button size="sm" variant="outline" onClick={() => setRestoreId(point.id)}>
                    Simulate Restore
                  </Button>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog open={!!detailId} onOpenChange={() => setDetailId(null)}>
        <DialogContent>
          {detailBackup && (
            <>
              <DialogHeader>
                <DialogTitle>Backup {detailBackup.id}</DialogTitle>
                <DialogDescription>Mock backup metadata — no real data stored</DialogDescription>
              </DialogHeader>
              <div className="space-y-2 text-sm">
                <p>Type: {BACKUP_TYPE_LABELS[detailBackup.type]}</p>
                <p>Status: {BACKUP_STATUS_LABELS[detailBackup.status]}</p>
                <p>Size: {formatFileSize(detailBackup.sizeBytes)}</p>
                <p>Storage: {detailBackup.storageReference}</p>
                {detailBackup.checksum && <p>Checksum: {detailBackup.checksum}</p>}
                {detailBackup.errorMessage && <p className="text-danger">{detailBackup.errorMessage}</p>}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!restoreId}
        onOpenChange={() => setRestoreId(null)}
        title="Simulate restore?"
        description={
          restorePoint
            ? `Simulation only — no production data will be changed. Recovery point: ${restorePoint.description}`
            : "Simulation only — no production data will be changed."
        }
        confirmLabel="Run Simulation"
        onConfirm={handleSimulateRestore}
      />
    </div>
  );
}
