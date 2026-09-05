"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, HelpCircle, Menu, Plus, Search } from "lucide-react";
import { OrganizationBrandMark } from "@/components/branding/organization-brand-mark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getInitials, formatDateTime, cn } from "@/lib/utils";
import { useCRMStore, useCurrentUser, usePermissions } from "@/store/CRMStoreProvider";
import { ComposeEmailDialog } from "@/components/email/compose-email-dialog";
import { DealFormDialog } from "@/components/deals/deal-form-dialog";
import { CustomerFormDialog } from "@/components/customers/customer-form-dialog";
import { MobileSearch } from "@/components/layout/mobile-search";
import { authService } from "@/services";

interface AppHeaderProps {
  onMenuClick?: () => void;
}

export function AppHeader({ onMenuClick }: AppHeaderProps) {
  const router = useRouter();
  const user = useCurrentUser();
  const { canViewNotifications } = usePermissions();
  const {
    search,
    getNotifications,
    getUnreadNotificationCount,
    markNotificationRead,
    markAllNotificationsRead,
    getOrganization,
  } = useCRMStore();
  const organization = getOrganization();

  const [query, setQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [showDeal, setShowDeal] = useState(false);
  const [showCustomer, setShowCustomer] = useState(false);
  const [showEmail, setShowEmail] = useState(false);

  const results = useMemo(() => (query.trim() ? search(query) : []), [query, search]);
  const notifications = getNotifications();
  const unreadCount = getUnreadNotificationCount();

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-card px-3 sm:h-16 sm:gap-3 sm:px-4 lg:gap-4 lg:px-6">
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 lg:hidden"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <Link href="/dashboard" className="flex shrink-0 items-center gap-2 lg:hidden">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white">
            <OrganizationBrandMark variant="header" />
          </div>
          <span className="hidden max-w-[10rem] truncate text-sm font-bold tracking-wide sm:inline">
            {organization.settings.companyName.toUpperCase()}
          </span>
        </Link>

        <div className="relative hidden max-w-md flex-1 md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search customers, deals, POs, employees..."
            className="h-10 rounded-full border-border bg-background pl-9"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowResults(true);
            }}
            onFocus={() => setShowResults(true)}
            onBlur={() => setTimeout(() => setShowResults(false), 200)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && query.trim()) {
                router.push(`/search?q=${encodeURIComponent(query.trim())}`);
              }
            }}
          />
          {showResults && query.trim() && (
            <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-xl border border-border bg-card shadow-lg">
              <ScrollArea className="max-h-72">
                {results.map((r) => (
                  <button
                    key={`${r.type}-${r.id}`}
                    type="button"
                    className="flex w-full flex-col gap-0.5 border-b border-border px-4 py-3 text-left hover:bg-muted/50 last:border-0"
                    onMouseDown={() => router.push(r.href)}
                  >
                    <span className="text-xs uppercase text-muted-foreground">{r.type}</span>
                    <span className="font-medium">{r.title}</span>
                    <span className="text-sm text-muted-foreground">{r.subtitle}</span>
                  </button>
                ))}
                <button
                  type="button"
                  className="w-full px-4 py-3 text-left text-sm font-medium text-primary hover:bg-muted/50"
                  onMouseDown={() => router.push(`/search?q=${encodeURIComponent(query.trim())}`)}
                >
                  View all results
                </button>
              </ScrollArea>
            </div>
          )}
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileSearchOpen(true)}
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="accent" size="icon" className="sm:hidden" aria-label="Quick actions">
                <Plus className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setShowDeal(true)}>New Deal</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowCustomer(true)}>Add Customer</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowEmail(true)}>Compose Email</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="accent" size="sm" className="hidden sm:inline-flex">
                <Plus className="h-4 w-4" />
                <span className="hidden md:inline">Quick Action</span>
                <span className="md:hidden">New</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setShowDeal(true)}>New Deal</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowCustomer(true)}>Add Customer</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowEmail(true)}>Compose Email</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative shrink-0">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-lime text-[10px] font-bold text-primary">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[min(calc(100vw-2rem),320px)]">
              <div className="flex items-center justify-between px-2 py-1.5">
                <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto px-2 py-1 text-xs"
                  onClick={() => markAllNotificationsRead()}
                >
                  Mark all read
                </Button>
              </div>
              <DropdownMenuSeparator />
              <ScrollArea className="max-h-72">
                {notifications.length === 0 ? (
                  <p className="p-4 text-sm text-muted-foreground">No notifications</p>
                ) : (
                  notifications.map((n) => (
                    <DropdownMenuItem
                      key={n.id}
                      className={cn("flex flex-col items-start gap-1 p-3", !n.read && "bg-muted/50")}
                      onClick={() => {
                        markNotificationRead(n.id);
                        if (n.href) router.push(n.href);
                      }}
                    >
                      <span className="font-medium">{n.title}</span>
                      <span className="text-xs text-muted-foreground">{n.message}</span>
                      <span className="text-[10px] text-muted-foreground">{formatDateTime(n.timestamp)}</span>
                    </DropdownMenuItem>
                  ))
                )}
              </ScrollArea>
              {canViewNotifications ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/notifications" className="w-full">View all notifications</Link>
                  </DropdownMenuItem>
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="icon"
            className="hidden shrink-0 lg:inline-flex"
            title="Help center coming soon"
          >
            <HelpCircle className="h-5 w-5" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 shrink-0 rounded-full p-0">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user?.avatar} alt={user?.name} />
                  <AvatarFallback>{user ? getInitials(user.name) : "?"}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div>
                  <p className="font-medium">{user?.name}</p>
                  <p className="text-xs font-normal text-muted-foreground">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="lg:hidden" disabled>
                Help center coming soon
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={async (event) => {
                  event.preventDefault();
                  await authService.signOut();
                  router.push("/login");
                }}
              >
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <MobileSearch open={mobileSearchOpen} onOpenChange={setMobileSearchOpen} />

      <DealFormDialog open={showDeal} onOpenChange={setShowDeal} />
      <CustomerFormDialog open={showCustomer} onOpenChange={setShowCustomer} />
      <ComposeEmailDialog open={showEmail} onOpenChange={setShowEmail} />
    </>
  );
}
