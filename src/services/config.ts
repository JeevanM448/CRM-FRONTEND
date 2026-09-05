import { isSupabaseConfigured } from "@/lib/supabase/client";

export type ServiceMode = "mock" | "production";

/**
 * Determines which service implementation the app uses.
 * Default: mock (safe for local dev and until backend phases are complete).
 */
export function getServiceMode(): ServiceMode {
  const flag = process.env.NEXT_PUBLIC_USE_MOCK_SERVICES;
  if (flag === "false" && isSupabaseConfigured) {
    return "production";
  }
  return "mock";
}

export function isMockMode(): boolean {
  return getServiceMode() === "mock";
}

export function isProductionMode(): boolean {
  return getServiceMode() === "production";
}
