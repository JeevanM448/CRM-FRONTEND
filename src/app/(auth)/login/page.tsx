"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PortalSelection } from "@/components/auth/portal-selection";
import { RoleLoginForm } from "@/components/auth/role-login-form";
import { OrganizationBrandMark } from "@/components/branding/organization-brand-mark";
import { OrganizationWatermark } from "@/components/branding/organization-watermark";
import type { LoginPortalRole } from "@/lib/auth/portals";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"portal" | "login">("portal");
  const [selectedRole, setSelectedRole] = useState<LoginPortalRole | null>(null);

  function continueAs(role: LoginPortalRole) {
    setSelectedRole(role);
    setStep("login");
  }

  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-primary p-8 text-primary-foreground lg:flex xl:p-12">
        <OrganizationWatermark />
        <div className="relative z-10 flex justify-center">
          <div className="flex w-full max-w-sm items-center justify-center rounded-2xl bg-white px-6 py-4">
            <OrganizationBrandMark variant="login" />
          </div>
        </div>
        <div className="relative z-10 mx-auto max-w-md space-y-4 text-center">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-white/60">Sales OS</p>
          <h1 className="text-4xl font-bold leading-tight">
            Enterprise sales automation for modern teams
          </h1>
          <p className="text-lg text-white/70">
            Connect customers, deals, emails, purchase orders, and AI-powered
            follow-ups in one unified platform.
          </p>
        </div>
        <p className="relative z-10 text-center text-sm text-white/40">© 2026 Shiny Stone Sales OS</p>
      </div>

      <div className="relative flex flex-1 items-center justify-center overflow-hidden p-4 sm:p-6">
        <OrganizationWatermark />
        <div className="relative z-10 w-full max-w-lg">
          <div className="mb-6 flex justify-center px-4 lg:hidden">
            <div className="flex w-full max-w-[16rem] items-center justify-center rounded-2xl border border-border bg-white px-4 py-3 sm:max-w-xs">
              <OrganizationBrandMark variant="login" />
            </div>
          </div>

          {step === "portal" || !selectedRole ? (
            <PortalSelection
              selectedRole={selectedRole}
              onSelect={setSelectedRole}
              onContinue={continueAs}
            />
          ) : (
            <div className="mx-auto max-w-md">
              <RoleLoginForm
                portalRole={selectedRole}
                onChangePortal={() => setStep("portal")}
                onSuccess={() => {
                  toast.success("Welcome back to Shiny Stone Sales OS");
                  router.push("/dashboard");
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
