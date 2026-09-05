import type { UserRole } from "@/types";

/** Login portals map 1:1 onto existing UserRole values. Do not add a second role enum. */
export type LoginPortalRole = Extract<UserRole, "admin" | "sales_manager" | "salesperson">;

export interface LoginPortal {
  role: LoginPortalRole;
  title: string;
  description: string;
  cta: string;
  loginTitle: string;
  loginDescription: string;
  demoEmail: string;
}

export const LOGIN_PORTALS: LoginPortal[] = [
  {
    role: "admin",
    title: "Admin",
    description: "Manage and monitor the entire sales organization",
    cta: "Continue as Admin",
    loginTitle: "Admin Login",
    loginDescription: "Sign in to the Admin Portal",
    demoEmail: "jeevan.elias@shinystone.com",
  },
  {
    role: "sales_manager",
    title: "Manager",
    description: "Monitor your sales team and team performance",
    cta: "Continue as Manager",
    loginTitle: "Manager Login",
    loginDescription: "Sign in to the Manager Portal",
    demoEmail: "priya.nair@shinystone.com",
  },
  {
    role: "salesperson",
    title: "Salesperson",
    description: "Manage your customers, deals and sales activities",
    cta: "Continue as Salesperson",
    loginTitle: "Salesperson Login",
    loginDescription: "Sign in to the Salesperson Portal",
    demoEmail: "john.smith@shinystone.com",
  },
];

export function getLoginPortal(role: LoginPortalRole): LoginPortal {
  const portal = LOGIN_PORTALS.find((p) => p.role === role);
  if (!portal) throw new Error(`Unknown login portal: ${role}`);
  return portal;
}

export function getPortalName(role: UserRole): string {
  if (role === "admin") return "Admin Portal";
  if (role === "sales_manager") return "Manager Portal";
  if (role === "salesperson") return "Salesperson Portal";
  return "Sales OS";
}
