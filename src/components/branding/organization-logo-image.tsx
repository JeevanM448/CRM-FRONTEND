"use client";

import { cn } from "@/lib/utils";
import { ORGANIZATION_LOGO_ALT } from "@/lib/branding/organization-brand";

interface OrganizationLogoImageProps {
  src: string;
  alt?: string;
  className?: string;
  decorative?: boolean;
}

export function OrganizationLogoImage({
  src,
  alt = ORGANIZATION_LOGO_ALT,
  className,
  decorative = false,
}: OrganizationLogoImageProps) {
  return (
    // Mixed sources: official public asset or mock data URL from OrganizationService.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={decorative ? "" : alt}
      aria-hidden={decorative || undefined}
      draggable={false}
      className={cn("max-h-full max-w-full object-contain object-center", className)}
    />
  );
}
