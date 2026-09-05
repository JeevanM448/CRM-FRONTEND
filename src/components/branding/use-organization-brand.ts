"use client";

import { useCRMStore } from "@/store/CRMStoreProvider";
import {
  getOrganizationBrandLogoUrl,
  hasCustomOrganizationLogo,
  ORGANIZATION_LOGO_ALT,
} from "@/lib/branding/organization-brand";

export function useOrganizationBrand() {
  const { getOrganization } = useCRMStore();
  const organization = getOrganization();
  const logoUrl = getOrganizationBrandLogoUrl(organization.logo);

  return {
    logoUrl,
    hasCustomLogo: hasCustomOrganizationLogo(organization.logo),
    companyName: organization.settings.companyName,
    alt: ORGANIZATION_LOGO_ALT,
    organization,
  };
}
