"use client";

import { Gem } from "lucide-react";
import { cn } from "@/lib/utils";
import { OrganizationLogoImage } from "./organization-logo-image";
import { useOrganizationBrand } from "./use-organization-brand";

const fallbackSizes = {
  sm: "h-8 w-8",
  md: "h-9 w-9",
  lg: "h-11 w-11",
};

const iconSizes = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
};

const variantFrames: Record<string, string> = {
  compact:
    "h-8 w-8 max-h-8 max-w-8 sm:h-9 sm:w-9 sm:max-h-9 sm:max-w-9",
  sidebar:
    "h-9 w-9 max-h-9 max-w-9",
  header:
    "h-8 w-8 max-h-8 max-w-8",
  login:
    "h-auto w-full max-h-[7.5rem] max-w-[13.5rem] sm:max-h-36 sm:max-w-xs md:max-h-40 md:max-w-sm",
  preview:
    "h-24 w-full max-h-24 max-w-[13.5rem] sm:h-28 sm:max-h-28 sm:max-w-[15rem]",
};

interface OrganizationBrandMarkProps {
  size?: keyof typeof fallbackSizes;
  variant?: keyof typeof variantFrames;
  className?: string;
  imageClassName?: string;
  fallbackClassName?: string;
}

export function OrganizationBrandMark({
  size = "md",
  variant,
  className,
  imageClassName,
  fallbackClassName,
}: OrganizationBrandMarkProps) {
  const { logoUrl } = useOrganizationBrand();
  const resolvedVariant = variant ?? (size === "lg" ? "login" : size === "sm" ? "header" : "sidebar");

  if (!logoUrl) {
    return (
      <div
        className={cn(
          fallbackSizes[size],
          "flex shrink-0 items-center justify-center rounded-xl bg-brand-lime/15",
          fallbackClassName,
          className
        )}
      >
        <Gem className={cn(iconSizes[size], "text-brand-lime")} />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden",
        variantFrames[resolvedVariant],
        className
      )}
    >
      <OrganizationLogoImage src={logoUrl} className={cn("h-auto w-auto", imageClassName)} />
    </div>
  );
}
