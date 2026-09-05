"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Gem } from "lucide-react";
import { toast } from "sonner";
import { PortalSelection } from "@/components/auth/portal-selection";
import { RoleLoginForm } from "@/components/auth/role-login-form";
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
      <div className="hidden w-1/2 flex-col justify-between bg-primary p-12 text-primary-foreground lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-lime/15">
            <Gem className="h-6 w-6 text-brand-lime" />
          </div>
          <div>
            <p className="text-lg font-bold tracking-wide">SHINY STONE</p>
            <p className="text-sm text-white/60">Sales OS</p>
          </div>
        </div>
        <div className="max-w-md space-y-4">
          <h1 className="text-4xl font-bold leading-tight">
            Enterprise sales automation for modern teams
          </h1>
          <p className="text-lg text-white/70">
            Connect customers, deals, emails, purchase orders, and AI-powered
            follow-ups in one unified platform.
          </p>
        </div>
        <p className="text-sm text-white/40">© 2026 Shiny Stone Sales OS</p>
      </div>

      <div className="flex flex-1 items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-lg">
          <div className="mb-4 flex justify-center lg:hidden">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary">
              <Gem className="h-6 w-6 text-brand-lime" />
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
