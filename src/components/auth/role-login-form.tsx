"use client";

import { useEffect, useState } from "react";
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
import { toast } from "sonner";

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
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSubmitting, setForgotSubmitting] = useState(false);

  useEffect(() => {
    setEmail(portal.demoEmail);
    setPassword("");
    setErrors({});
    setFormError(null);
    setForgotOpen(false);
    setForgotEmail("");
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

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      toast.error("Enter your sign-in email");
      return;
    }
    setForgotSubmitting(true);
    try {
      await authService.requestPasswordReset(forgotEmail);
      toast.success("If an account exists for that email, password reset instructions will be sent.");
      setForgotOpen(false);
      setForgotEmail("");
    } catch {
      toast.success("If an account exists for that email, password reset instructions will be sent.");
      setForgotOpen(false);
    } finally {
      setForgotSubmitting(false);
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

        {forgotOpen ? (
          <form onSubmit={handleForgotPassword} className="space-y-4" noValidate>
            <p className="text-sm text-muted-foreground">
              Enter your sign-in email. If an account exists, reset instructions will be sent when email
              integration is connected.
            </p>
            <div className="space-y-2">
              <Label htmlFor="forgot-email">Sign-in email</Label>
              <Input
                id="forgot-email"
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                autoComplete="username"
              />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setForgotOpen(false)}>
                Back to sign in
              </Button>
              <SubmitButton loading={forgotSubmitting} loadingText="Sending..." className="flex-1">
                Send reset link
              </SubmitButton>
            </div>
          </form>
        ) : (
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
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(email);
                    setForgotOpen(true);
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Forgot password?
                </button>
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
            <p className="text-xs text-muted-foreground">
              Portal selection is for navigation only. Your access role is determined by your account.
            </p>
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
        )}

        {!forgotOpen && (
          <>
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
          </>
        )}
      </CardContent>
    </Card>
  );
}
