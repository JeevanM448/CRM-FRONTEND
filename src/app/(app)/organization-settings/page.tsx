"use client";

import { useMemo, useState } from "react";
import { Building, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
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
import { Switch } from "@/components/ui/switch";
import { useCRMStore, usePermissions } from "@/store/CRMStoreProvider";
import {
  DATE_FORMAT_OPTIONS,
  SUPPORTED_CURRENCIES,
  SUPPORTED_TIMEZONES,
  teamHasInactiveMembers,
} from "@/store/organization";
import { OrganizationLogoManager } from "@/components/organization/organization-logo-manager";
import { validateOrganizationProfile } from "@/lib/validation";
import type { DealStage, POStatus } from "@/types";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function OrganizationSettingsPage() {
  const { canManageOrganization } = usePermissions();
  const {
    getOrganization,
    updateOrganizationProfile,
    updateRegionalSettings,
    updateBusinessRules,
    createOrganizationTeam,
    renameOrganizationTeam,
    setOrganizationTeamStatus,
    createSalesRegion,
    renameSalesRegion,
    setSalesRegionStatus,
    updatePipelineStage,
    updatePOStatusConfig,
    getOrganizationTeamMemberCount,
    getSnapshot,
  } = useCRMStore();

  const organization = getOrganization();
  const users = getSnapshot().users;

  const [profile, setProfile] = useState(organization.settings);
  const [regional, setRegional] = useState({
    currency: organization.settings.currency,
    timezone: organization.settings.timezone,
    dateFormat: organization.settings.dateFormat,
    fiscalYearStartMonth: organization.settings.fiscalYearStartMonth,
    defaultLanguage: organization.settings.defaultLanguage,
  });
  const [rules, setRules] = useState(organization.businessRules);
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingRegional, setSavingRegional] = useState(false);
  const [savingRules, setSavingRules] = useState(false);

  const [teamDialogOpen, setTeamDialogOpen] = useState(false);
  const [teamForm, setTeamForm] = useState({ name: "", code: "" });
  const [renameTeam, setRenameTeam] = useState<{ id: string; name: string; code: string } | undefined>();
  const [regionDialogOpen, setRegionDialogOpen] = useState(false);
  const [regionForm, setRegionForm] = useState({ name: "", code: "" });
  const [renameRegion, setRenameRegion] = useState<{ id: string; name: string; code: string } | undefined>();

  const sortedStages = useMemo(
    () => [...organization.pipelineStages].sort((a, b) => a.order - b.order),
    [organization.pipelineStages]
  );
  const sortedPoStatuses = useMemo(
    () => [...organization.poStatuses].sort((a, b) => a.order - b.order),
    [organization.poStatuses]
  );

  if (!canManageOrganization) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="Access restricted"
        description="Only administrators with organization settings access can view this page."
      />
    );
  }

  async function saveProfile() {
    const errors = validateOrganizationProfile({
      companyName: profile.companyName,
      email: profile.email,
      website: profile.website,
      phone: profile.phone,
    });
    setProfileErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setSavingProfile(true);
    try {
      const next = updateOrganizationProfile(profile);
      setProfile(next);
      toast.success("Organization profile saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save profile");
    } finally {
      setSavingProfile(false);
    }
  }

  async function saveRegional() {
    setSavingRegional(true);
    try {
      const next = updateRegionalSettings(regional);
      setProfile((current) => ({ ...current, ...next }));
      toast.success("Regional settings saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save regional settings");
    } finally {
      setSavingRegional(false);
    }
  }

  async function saveRules() {
    setSavingRules(true);
    try {
      const next = updateBusinessRules(rules);
      setRules(next);
      toast.success("Business rules saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save business rules");
    } finally {
      setSavingRules(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Organization Settings"
        description="Configure organization-wide CRM profile, teams, regions, and pipeline settings."
      />

      <Card>
        <CardHeader>
          <CardTitle>Organization Profile</CardTitle>
          <CardDescription>Company identity and contact details.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <OrganizationLogoManager />
          <div className="space-y-2 sm:col-span-2">
            <Label>Company Name</Label>
            <Input
              value={profile.companyName}
              onChange={(e) => setProfile({ ...profile, companyName: e.target.value })}
            />
            {profileErrors.companyName ? (
              <p className="text-xs text-destructive">{profileErrors.companyName}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label>Legal Name</Label>
            <Input
              value={profile.legalName}
              onChange={(e) => setProfile({ ...profile, legalName: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Company Email</Label>
            <Input
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
            />
            {profileErrors.email ? (
              <p className="text-xs text-destructive">{profileErrors.email}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Website</Label>
            <Input
              value={profile.website}
              onChange={(e) => setProfile({ ...profile, website: e.target.value })}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Address</Label>
            <Input
              value={profile.address}
              onChange={(e) => setProfile({ ...profile, address: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>City</Label>
            <Input value={profile.city} onChange={(e) => setProfile({ ...profile, city: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>State</Label>
            <Input value={profile.state} onChange={(e) => setProfile({ ...profile, state: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Country</Label>
            <Input
              value={profile.country}
              onChange={(e) => setProfile({ ...profile, country: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Postal Code</Label>
            <Input
              value={profile.postalCode}
              onChange={(e) => setProfile({ ...profile, postalCode: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <SubmitButton loading={savingProfile} loadingText="Saving..." onClick={saveProfile}>
              Save Changes
            </SubmitButton>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Regional Settings</CardTitle>
          <CardDescription>Currency, timezone, and formatting for future display.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Currency</Label>
            <Select
              value={regional.currency}
              onValueChange={(value) => setRegional({ ...regional, currency: value as typeof regional.currency })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SUPPORTED_CURRENCIES.map((currency) => (
                  <SelectItem key={currency} value={currency}>{currency}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Timezone</Label>
            <Select
              value={regional.timezone}
              onValueChange={(value) => setRegional({ ...regional, timezone: value })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SUPPORTED_TIMEZONES.map((timezone) => (
                  <SelectItem key={timezone} value={timezone}>{timezone}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Date Format</Label>
            <Select
              value={regional.dateFormat}
              onValueChange={(value) =>
                setRegional({ ...regional, dateFormat: value as typeof regional.dateFormat })
              }
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {DATE_FORMAT_OPTIONS.map((format) => (
                  <SelectItem key={format} value={format}>{format}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Fiscal Year Start</Label>
            <Select
              value={String(regional.fiscalYearStartMonth)}
              onValueChange={(value) =>
                setRegional({ ...regional, fiscalYearStartMonth: Number(value) })
              }
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {MONTHS.map((month, index) => (
                  <SelectItem key={month} value={String(index + 1)}>{month}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Default Language</Label>
            <Input
              value={regional.defaultLanguage}
              onChange={(e) => setRegional({ ...regional, defaultLanguage: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <SubmitButton loading={savingRegional} loadingText="Saving..." onClick={saveRegional}>
              Save Changes
            </SubmitButton>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle>Teams</CardTitle>
            <CardDescription>
              Team names remain linked to employees by name. Deactivating does not remove members.
            </CardDescription>
          </div>
          <Button variant="accent" onClick={() => setTeamDialogOpen(true)}>Add Team</Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {organization.teams.map((team) => {
            const members = getOrganizationTeamMemberCount(team.name);
            const warning = teamHasInactiveMembers(team, users);
            return (
              <Card key={team.id} className="p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="font-medium">{team.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {team.code} · {members} member{members === 1 ? "" : "s"}
                    </p>
                    {warning ? (
                      <p className="mt-1 text-xs text-amber-600">
                        This inactive team still has assigned employees.
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={team.status === "active" ? "active" : "inactive"} />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRenameTeam({ id: team.id, name: team.name, code: team.code })}
                    >
                      Rename
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        try {
                          setOrganizationTeamStatus(
                            team.id,
                            team.status === "active" ? "inactive" : "active"
                          );
                          toast.success(`Team ${team.status === "active" ? "deactivated" : "activated"}`);
                        } catch (error) {
                          toast.error(error instanceof Error ? error.message : "Unable to update team");
                        }
                      }}
                    >
                      {team.status === "active" ? "Deactivate" : "Activate"}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle>Sales Regions</CardTitle>
            <CardDescription>Regions are available for future assignment workflows.</CardDescription>
          </div>
          <Button variant="accent" onClick={() => setRegionDialogOpen(true)}>Add Region</Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {organization.regions.map((region) => (
            <Card key={region.id} className="p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="font-medium">{region.name}</p>
                  <p className="text-sm text-muted-foreground">{region.code}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={region.status === "active" ? "active" : "inactive"} />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setRenameRegion({ id: region.id, name: region.name, code: region.code })
                    }
                  >
                    Rename
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      try {
                        setSalesRegionStatus(
                          region.id,
                          region.status === "active" ? "inactive" : "active"
                        );
                        toast.success(
                          `Region ${region.status === "active" ? "deactivated" : "activated"}`
                        );
                      } catch (error) {
                        toast.error(error instanceof Error ? error.message : "Unable to update region");
                      }
                    }}
                  >
                    {region.status === "active" ? "Deactivate" : "Activate"}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sales Pipeline</CardTitle>
          <CardDescription>
            Stage IDs remain stable. Deactivated stages stay visible for existing deals only.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 md:hidden">
            {sortedStages.map((stage) => (
              <Card key={stage.id} className="p-4">
                <div className="flex flex-col gap-3">
                  <div>
                    <p className="font-medium">{stage.label}</p>
                    <p className="text-sm text-muted-foreground font-mono">{stage.id} · Order {stage.order}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={stage.status === "active" ? "active" : "inactive"} />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const label = window.prompt("Stage label", stage.label);
                        if (!label) return;
                        updatePipelineStage(stage.id as DealStage, { label: label.trim() });
                        toast.success("Pipeline stage updated");
                      }}
                    >
                      Rename
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        updatePipelineStage(stage.id as DealStage, {
                          status: stage.status === "active" ? "inactive" : "active",
                        });
                        toast.success("Pipeline stage updated");
                      }}
                    >
                      {stage.status === "active" ? "Deactivate" : "Activate"}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Stage</TableHead>
                  <TableHead>Label</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedStages.map((stage) => (
                  <TableRow key={stage.id}>
                    <TableCell className="font-mono text-xs">{stage.id}</TableCell>
                    <TableCell>{stage.label}</TableCell>
                    <TableCell>{stage.order}</TableCell>
                    <TableCell>
                      <StatusBadge status={stage.status === "active" ? "active" : "inactive"} />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const label = window.prompt("Stage label", stage.label);
                            if (!label) return;
                            updatePipelineStage(stage.id as DealStage, { label: label.trim() });
                            toast.success("Pipeline stage updated");
                          }}
                        >
                          Rename
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            updatePipelineStage(stage.id as DealStage, {
                              status: stage.status === "active" ? "inactive" : "active",
                            });
                            toast.success("Pipeline stage updated");
                          }}
                        >
                          {stage.status === "active" ? "Deactivate" : "Activate"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Purchase Order Configuration</CardTitle>
          <CardDescription>Status IDs remain stable for historical purchase orders.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {sortedPoStatuses.map((status) => (
            <Card key={status.id} className="p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="font-medium">{status.label}</p>
                  <p className="text-sm text-muted-foreground font-mono">{status.id}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={status.status === "active" ? "active" : "inactive"} />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const label = window.prompt("Status label", status.label);
                      if (!label) return;
                      updatePOStatusConfig(status.id as POStatus, { label: label.trim() });
                      toast.success("PO status updated");
                    }}
                  >
                    Rename
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      updatePOStatusConfig(status.id as POStatus, {
                        status: status.status === "active" ? "inactive" : "active",
                      });
                      toast.success("PO status updated");
                    }}
                  >
                    {status.status === "active" ? "Deactivate" : "Activate"}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Business Rules</CardTitle>
          <CardDescription>Supported defaults used by the current mock CRM workflows.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Default follow-up duration (days)</Label>
            <Input
              type="number"
              min={1}
              value={rules.defaultFollowUpDays}
              onChange={(e) =>
                setRules({ ...rules, defaultFollowUpDays: Number(e.target.value) || 1 })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Default target period</Label>
            <Input
              value={rules.defaultTargetPeriod}
              onChange={(e) => setRules({ ...rules, defaultTargetPeriod: e.target.value })}
            />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-border p-4 sm:col-span-2">
            <div>
              <p className="font-medium">Use organization currency for deals</p>
              <p className="text-sm text-muted-foreground">Affects future display configuration.</p>
            </div>
            <Switch
              checked={rules.useOrganizationCurrencyForDeals}
              onCheckedChange={(checked) =>
                setRules({ ...rules, useOrganizationCurrencyForDeals: checked })
              }
            />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-border p-4 sm:col-span-2">
            <div>
              <p className="font-medium">PO review required</p>
              <p className="text-sm text-muted-foreground">Keeps approval workflow enabled in mock mode.</p>
            </div>
            <Switch
              checked={rules.poReviewRequired}
              onCheckedChange={(checked) => setRules({ ...rules, poReviewRequired: checked })}
            />
          </div>
          <div className="sm:col-span-2">
            <SubmitButton loading={savingRules} loadingText="Saving..." onClick={saveRules}>
              Save Changes
            </SubmitButton>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-start gap-3 p-4 text-sm text-muted-foreground">
          <Building className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Team membership remains stored on users as team names for backward compatibility. Creating
            or renaming teams updates configuration only; employees are renamed with the team when an
            admin renames a team. Historical deals, POs, and reports are never rewritten.
          </p>
        </CardContent>
      </Card>

      <Dialog open={teamDialogOpen} onOpenChange={setTeamDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Team</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Team Name</Label>
              <Input value={teamForm.name} onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Team Code</Label>
              <Input value={teamForm.code} onChange={(e) => setTeamForm({ ...teamForm, code: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="accent"
              onClick={() => {
                try {
                  createOrganizationTeam(teamForm);
                  setTeamForm({ name: "", code: "" });
                  setTeamDialogOpen(false);
                  toast.success("Team created");
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Unable to create team");
                }
              }}
            >
              Create Team
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(renameTeam)} onOpenChange={(open) => !open && setRenameTeam(undefined)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Rename Team</DialogTitle></DialogHeader>
          {renameTeam ? (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Team Name</Label>
                <Input
                  value={renameTeam.name}
                  onChange={(e) => setRenameTeam({ ...renameTeam, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Team Code</Label>
                <Input
                  value={renameTeam.code}
                  onChange={(e) => setRenameTeam({ ...renameTeam, code: e.target.value })}
                />
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button
              variant="accent"
              onClick={() => {
                if (!renameTeam) return;
                try {
                  renameOrganizationTeam(renameTeam.id, renameTeam.name, renameTeam.code);
                  setRenameTeam(undefined);
                  toast.success("Team renamed");
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Unable to rename team");
                }
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={regionDialogOpen} onOpenChange={setRegionDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Region</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Region Name</Label>
              <Input value={regionForm.name} onChange={(e) => setRegionForm({ ...regionForm, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Region Code</Label>
              <Input value={regionForm.code} onChange={(e) => setRegionForm({ ...regionForm, code: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="accent"
              onClick={() => {
                try {
                  createSalesRegion(regionForm);
                  setRegionForm({ name: "", code: "" });
                  setRegionDialogOpen(false);
                  toast.success("Region created");
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Unable to create region");
                }
              }}
            >
              Create Region
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(renameRegion)} onOpenChange={(open) => !open && setRenameRegion(undefined)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Rename Region</DialogTitle></DialogHeader>
          {renameRegion ? (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Region Name</Label>
                <Input
                  value={renameRegion.name}
                  onChange={(e) => setRenameRegion({ ...renameRegion, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Region Code</Label>
                <Input
                  value={renameRegion.code}
                  onChange={(e) => setRenameRegion({ ...renameRegion, code: e.target.value })}
                />
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button
              variant="accent"
              onClick={() => {
                if (!renameRegion) return;
                try {
                  renameSalesRegion(renameRegion.id, renameRegion.name, renameRegion.code);
                  setRenameRegion(undefined);
                  toast.success("Region renamed");
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Unable to rename region");
                }
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
