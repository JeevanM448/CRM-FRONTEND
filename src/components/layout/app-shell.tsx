"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppSidebar } from "./app-sidebar";
import { AppHeader } from "./app-header";
import { RoleAccessGate } from "./role-access-gate";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useScrollToTop } from "@/hooks/use-scroll-to-top";
import { useCurrentUser } from "@/store/CRMStoreProvider";

const SIDEBAR_COLLAPSED_KEY = "shiny-stone-sidebar-collapsed";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const user = useCurrentUser();
  const router = useRouter();

  useScrollToTop();

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    if (stored === "true") setCollapsed(true);
  }, []);

  useEffect(() => {
    if (mounted && !user) {
      router.replace("/login");
    }
  }, [mounted, user, router]);

  function handleToggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      return next;
    });
  }

  if (!mounted || !user) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden shrink-0 lg:block">
        <AppSidebar collapsed={collapsed} onToggle={handleToggleCollapsed} />
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="w-[min(280px,85vw)] border-none bg-sidebar p-0 text-white [&>button]:hidden"
        >
          <AppSidebar
            collapsed={false}
            onToggle={() => {}}
            mobile
            onNavigate={() => setMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-auto p-3 sm:p-4 lg:p-6">
          <RoleAccessGate>{children}</RoleAccessGate>
        </main>
      </div>
    </div>
  );
}
