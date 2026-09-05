"use client";

import { OrganizationLogoImage } from "./organization-logo-image";
import { useOrganizationBrand } from "./use-organization-brand";

export function OrganizationWatermark() {
  const { logoUrl } = useOrganizationBrand();

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
    >
      <div className="absolute left-1/2 top-1/2 flex w-[min(40rem,70%)] max-h-[min(28rem,55%)] -translate-x-1/2 -translate-y-1/2 items-center justify-center">
        <OrganizationLogoImage src={logoUrl} decorative className="opacity-[0.06]" />
      </div>
    </div>
  );
}
