"use client";

import { Handshake, Shield, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LOGIN_PORTALS, type LoginPortalRole } from "@/lib/auth/portals";

const portalIcons = {
  admin: Shield,
  sales_manager: Users,
  salesperson: Handshake,
} as const;

interface PortalSelectionProps {
  selectedRole: LoginPortalRole | null;
  onSelect: (role: LoginPortalRole) => void;
  onContinue: (role: LoginPortalRole) => void;
}

export function PortalSelection({ selectedRole, onSelect, onContinue }: PortalSelectionProps) {
  return (
    <Card className="w-full max-w-lg border-border shadow-lg">
      <CardHeader className="space-y-2 text-center">
        <CardTitle className="text-2xl">Welcome to Shiny Stone Sales OS</CardTitle>
        <CardDescription className="text-base">Select your portal to continue</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {LOGIN_PORTALS.map((portal) => {
          const Icon = portalIcons[portal.role];
          const selected = selectedRole === portal.role;
          return (
            <div
              key={portal.role}
              role="button"
              tabIndex={0}
              aria-pressed={selected}
              onClick={() => onSelect(portal.role)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(portal.role);
                }
              }}
              className={cn(
                "w-full rounded-2xl border border-border bg-card p-4 text-left transition-all",
                "hover:border-brand-lime/50 hover:bg-muted/40",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                selected && "border-brand-lime bg-brand-lime/10 ring-2 ring-brand-lime"
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary",
                    selected && "bg-primary"
                  )}
                >
                  <Icon className="h-5 w-5 text-brand-lime" />
                </div>
                <div className="min-w-0 flex-1 space-y-3">
                  <div>
                    <p className="font-semibold">{portal.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{portal.description}</p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    className="w-full sm:w-auto"
                    onClick={(e) => {
                      e.stopPropagation();
                      onContinue(portal.role);
                    }}
                  >
                    {portal.cta}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
        <p className="pt-2 text-center text-xs text-muted-foreground">
          Demo portal selection only. Production authorization is not enabled.
        </p>
      </CardContent>
    </Card>
  );
}
