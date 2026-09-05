"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";
import { validateLogin } from "@/lib/validation";
import { getLoginPortal, type LoginPortalRole } from "@/lib/auth/portals";
import { authService } from "@/services";

interface RoleLoginFormProps {
  portalRole: LoginPortalRole;
  onChangePortal: () => void;
  onSuccess: () => void;
}

export function RoleLoginForm({ portalRole, onChangePortal, onSuccess }: RoleLoginFormProps) {
  const portal = getLoginPortal(portalRole);
  const [email, setEmail] = useState(portal.demoEmail);
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setEmail(portal.demoEmail);
    setPassword("");
    setErrors({});
    setFormError(null);
  }, [portal.demoEmail]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors = validateLogin({ email, password });
    setErrors(nextErrors);
    setFormError(null);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      await authService.signIn(email, password, portalRole);
      onSuccess();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Unable to sign in");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-md border-border shadow-lg">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl">{portal.loginTitle}</CardTitle>
        <CardDescription>{portal.loginDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <button
          type="button"
          onClick={onChangePortal}
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
        >
          <ArrowLeft className="h-4 w-4" />
          Change portal
        </button>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={Boolean(errors.email)}
              autoComplete="username"
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link href="#" className="text-xs text-muted-foreground hover:text-foreground">
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={Boolean(errors.password)}
              autoComplete="current-password"
            />
            {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
          </div>
          {formError && (
            <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">{formError}</p>
          )}
          <div className="flex items-center gap-2">
            <Checkbox id="remember" />
            <Label htmlFor="remember" className="text-sm font-normal">
              Remember me
            </Label>
          </div>
          <SubmitButton loading={submitting} loadingText="Signing in..." className="w-full">
            Sign in
          </SubmitButton>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" type="button" disabled>
            Google
          </Button>
          <Button variant="outline" type="button" disabled>
            Microsoft
          </Button>
        </div>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          SSO integration available in Settings
        </p>
      </CardContent>
    </Card>
  );
}
