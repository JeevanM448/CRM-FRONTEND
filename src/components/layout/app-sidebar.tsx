"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, Gem } from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { getNavigationGroups, iconMap, type IconName } from "@/config/navigation";
import { getPortalName } from "@/lib/auth/portals";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useCRMStore, useCurrentUser, usePermissions } from "@/store/CRMStoreProvider";

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobile?: boolean;
  onNavigate?: () => void;
}

export function AppSidebar({
  collapsed,
  onToggle,
  mobile = false,
  onNavigate,
}: AppSidebarProps) {
  const pathname = usePathname();
  const user = useCurrentUser();
  const { can } = usePermissions();
  const { getEmails, getUnreadNotificationCount } = useCRMStore();
  const unreadEmails = getEmails("inbox").filter((e) => !e.read).length;
  const unreadNotifications = getUnreadNotificationCount();
  const role = user?.role ?? "viewer";
  const navigationGroups = getNavigationGroups(role, can);
  const portalName = getPortalName(role);

  return (
    <aside
      className={cn(
        "flex h-full flex-col bg-sidebar text-sidebar-foreground transition-all duration-300",
        mobile ? "w-full" : collapsed ? "w-[72px]" : "w-[240px]"
      )}
    >
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
        <Link href="/dashboard" className="flex items-center gap-3" onClick={onNavigate}>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-lime/15">
            <Gem className="h-5 w-5 text-brand-lime" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-bold tracking-wide">SHINY STONE</p>
              <p className="truncate text-[11px] text-sidebar-muted">{portalName}</p>
            </div>
          )}
        </Link>
        {!mobile && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-sidebar-muted hover:bg-white/5 hover:text-white"
            onClick={onToggle}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-6">
          {navigationGroups.map((group) => (
            <div key={group.label}>
              {!collapsed && (
                <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-sidebar-muted">
                  {group.label}
                </p>
              )}
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const Icon = iconMap[item.icon as IconName];
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/dashboard" && pathname.startsWith(item.href));
                  const badge =
                    item.href === "/inbox"
                      ? unreadEmails
                      : undefined;

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onNavigate}
                        title={collapsed ? item.title : undefined}
                        className={cn(
                          "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-white/10 text-white"
                            : "text-sidebar-muted hover:bg-white/5 hover:text-white"
                        )}
                      >
                        {isActive && (
                          <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-brand-lime" />
                        )}
                        <Icon className="h-4 w-4 shrink-0" />
                        {!collapsed && (
                          <>
                            <span className="flex-1">{item.title}</span>
                            {badge !== undefined && badge > 0 && (
                              <Badge className="h-5 min-w-5 bg-brand-lime px-1.5 text-[10px] text-primary">
                                {badge}
                              </Badge>
                            )}
                          </>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </ScrollArea>

      <div className="border-t border-sidebar-border p-4">
        <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
          <Avatar className="h-9 w-9 border border-white/10">
            <AvatarImage src={user?.avatar} alt={user?.name} />
            <AvatarFallback className="bg-white/10 text-xs text-white">
              {user ? getInitials(user.name) : "?"}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{user?.name}</p>
              <p className="truncate text-xs text-sidebar-muted">{portalName}</p>
              {unreadNotifications > 0 && (
                <p className="text-[10px] text-brand-lime">{unreadNotifications} notifications</p>
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
