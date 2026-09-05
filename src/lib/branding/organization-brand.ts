import {
  resolveOrganizationLogoUrl,
  type OrganizationLogo,
} from "@/store/organizationLogo";

/**
 * Official Shiny Stone logo served from /public.
 * Future production: replace with organization.logoUrl from Supabase Storage.
 */
export const DEFAULT_ORGANIZATION_LOGO_URL = "/branding/shiny-stone-organization-logo.png";

export const ORGANIZATION_LOGO_ALT = "Shiny Stone organization logo";

export function getOrganizationBrandLogoUrl(
  logo: OrganizationLogo | null | undefined
): string {
  return resolveOrganizationLogoUrl(logo) ?? DEFAULT_ORGANIZATION_LOGO_URL;
}

export function hasCustomOrganizationLogo(logo: OrganizationLogo | null | undefined) {
  return Boolean(resolveOrganizationLogoUrl(logo));
}
