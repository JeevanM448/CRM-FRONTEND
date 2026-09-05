import { delay } from "@/store/storage";
import { readFileAsDataUrl } from "@/store/organizationLogo";
import { validateOrganizationLogoFile } from "@/lib/validation";
import * as store from "@/store/crmStore";
import type { OrganizationSettings } from "@/store/organization";
import type { OrganizationLogo } from "@/store/organizationLogo";

export async function getOrganization() {
  await delay();
  return store.getOrganization();
}

export async function updateOrganization(data: Partial<OrganizationSettings>) {
  await delay();
  return store.updateOrganizationProfile(data);
}

export async function uploadOrganizationLogo(file: File): Promise<OrganizationLogo> {
  await delay();
  const validationError = validateOrganizationLogoFile(file);
  if (validationError) throw new Error(validationError);
  const dataUrl = await readFileAsDataUrl(file);
  return store.uploadOrganizationLogo(file, dataUrl);
}

export async function removeOrganizationLogo() {
  await delay();
  store.removeOrganizationLogo();
}
