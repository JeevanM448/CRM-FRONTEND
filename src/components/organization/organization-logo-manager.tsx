"use client";

import { useRef, useState } from "react";
import { Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { OrganizationBrandMark } from "@/components/branding/organization-brand-mark";
import { useOrganizationBrand } from "@/components/branding/use-organization-brand";
import { organizationService } from "@/services";
import { usePermissions } from "@/store/CRMStoreProvider";
import { formatLogoFileSize, type OrganizationLogo } from "@/store/organizationLogo";
import { validateOrganizationLogoFile } from "@/lib/validation";

interface OrganizationLogoManagerProps {
  onLogoChange?: (logo: OrganizationLogo | null) => void;
}

export function OrganizationLogoManager({ onLogoChange }: OrganizationLogoManagerProps) {
  const { hasCustomLogo, organization } = useOrganizationBrand();
  const { canManageOrganization } = usePermissions();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const logo = organization.logo;

  async function handleFileSelected(file: File | undefined) {
    if (!file || !canManageOrganization) return;

    const validationError = validateOrganizationLogoFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setUploading(true);
    try {
      const nextLogo = await organizationService.uploadOrganizationLogo(file);
      onLogoChange?.(nextLogo);
      toast.success(logo ? "Organization logo updated" : "Organization logo uploaded");
    } catch (uploadError) {
      const message =
        uploadError instanceof Error ? uploadError.message : "Unable to upload logo";
      setError(message);
      toast.error(message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleRemove() {
    if (!canManageOrganization || !logo) return;
    setRemoving(true);
    setError(null);
    try {
      await organizationService.removeOrganizationLogo();
      onLogoChange?.(null);
      toast.success("Organization logo removed");
    } catch (removeError) {
      const message =
        removeError instanceof Error ? removeError.message : "Unable to remove logo";
      setError(message);
      toast.error(message);
    } finally {
      setRemoving(false);
    }
  }

  return (
    <div className="space-y-3 sm:col-span-2">
      <Label>Organization Logo</Label>
      <div className="flex flex-col gap-4 rounded-xl border border-border p-4 sm:flex-row sm:items-center">
        <div className="flex h-28 w-full max-w-[220px] items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-white p-2 sm:max-w-[15rem]">
          <OrganizationBrandMark variant="preview" />
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          {hasCustomLogo && logo ? (
            <div className="text-sm">
              <p className="font-medium truncate">{logo.fileName}</p>
              <p className="text-muted-foreground">
                {logo.mimeType} · {formatLogoFileSize(logo.size)}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Official Shiny Stone logo is in use. Upload a PNG, JPEG, or WEBP image up to 2 MB to
              replace it in login, sidebar, and watermark branding.
            </p>
          )}

          {canManageOrganization ? (
            <div className="flex flex-wrap gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(event) => handleFileSelected(event.target.files?.[0])}
              />
              <SubmitButton
                type="button"
                variant="outline"
                size="sm"
                loading={uploading}
                loadingText={logo ? "Replacing..." : "Uploading..."}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                {logo ? "Replace Logo" : "Upload Logo"}
              </SubmitButton>
              {hasCustomLogo && logo ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={removing || uploading}
                  onClick={handleRemove}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {removing ? "Removing..." : "Remove Logo"}
                </Button>
              ) : null}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Only administrators can change the organization logo.
            </p>
          )}

          {error ? <p className="text-xs text-destructive">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}
