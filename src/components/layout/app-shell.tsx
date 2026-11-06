"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeftRight, ChevronDown, LogOut, Menu, type LucideIcon } from "lucide-react";
import { TenantLogo } from "@/components/tenant/tenant-logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useLogout } from "@/features/auth/api";
import { useTenant } from "@/features/tenants/tenant-context";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useSession } from "@/stores/auth-store";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}

interface AppShellProps {
  area: string;
  nav: NavItem[];
  children: ReactNode;
}

function NavLinks({ nav, onNavigate }: { nav: NavItem[]; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className="flex flex-col gap-1">
      {nav.map((item) => {
        const active = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active ? "bg-sidebar-primary text-sidebar-primary-foreground" : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
          >
            <item.icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function UserMenu() {
  const tenant = useTenant();
  const session = useSession(tenant.slug);
  const logout = useLogout(tenant.slug);
  const router = useRouter();
  if (!session) return null;
  const { user } = session;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" className="h-10 gap-2 px-2" />}>
        <Avatar className="size-7">
          <AvatarFallback className="bg-primary text-xs text-primary-foreground">{initials(user.name)}</AvatarFallback>
        </Avatar>
        <span className="hidden max-w-36 truncate text-sm font-medium sm:inline">{user.name}</span>
        <ChevronDown className="size-4 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            <p className="truncate text-sm font-medium text-foreground">{user.name}</p>
            <p className="truncate text-xs font-normal">{user.email}</p>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/")}>
          <ArrowLeftRight />
          Switch institution
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          onClick={() => {
            logout();
            router.replace(`/${tenant.slug}/login`);
          }}
        >
          <LogOut />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppShell({ area, nav, children }: AppShellProps) {
  const tenant = useTenant();
  const [menuOpen, setMenuOpen] = useState(false);

  const brand = (
    <Link href={`/${tenant.slug}`} className="flex min-w-0 items-center">
      <TenantLogo tenant={tenant} showName />
    </Link>
  );

  return (
    <div className="min-h-dvh bg-muted/40">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r bg-sidebar px-4 py-5 lg:flex">
        <div className="px-2">{brand}</div>
        <p className="mt-6 mb-2 px-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">{area}</p>
        <NavLinks nav={nav} />
        <div className="mt-auto rounded-lg border bg-background p-3 text-xs text-muted-foreground">
          Need help? <a className="font-medium text-primary underline-offset-2 hover:underline" href={`mailto:${tenant.supportEmail}`}>{tenant.supportEmail}</a>
          <p className="mt-2 text-[11px]">Powered by 10MG Credit</p>
        </div>
      </aside>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="w-72 bg-sidebar p-4">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <div className="px-2 pt-1">{brand}</div>
          <p className="mt-4 mb-1 px-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">{area}</p>
          <NavLinks nav={nav} onNavigate={() => setMenuOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b bg-background/90 px-4 backdrop-blur sm:px-6">
          <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation" onClick={() => setMenuOpen(true)}>
            <Menu />
          </Button>
          <div className="min-w-0 lg:hidden">{brand}</div>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground md:inline">{area}</span>
            <UserMenu />
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
