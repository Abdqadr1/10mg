"use client";

import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { FullPageLoader } from "@/components/feedback/full-page-loader";
import { buttonVariants } from "@/components/ui/button";
import { useTenant } from "@/features/tenants/tenant-context";
import { useSession } from "@/stores/auth-store";
import type { Role } from "@/types";

export const HOME_BY_ROLE: Record<Role, string> = { lender_admin: "lender", customer: "portal" };

export function RequireAuth({ role, children }: { role: Role; children: ReactNode }) {
  const tenant = useTenant();
  const session = useSession(tenant.slug);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!session) router.replace(`/${tenant.slug}/login?next=${encodeURIComponent(pathname)}`);
  }, [session, router, pathname, tenant.slug]);

  if (!session) return <FullPageLoader label="Checking your session" />;

  if (session.user.role !== role) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
          <ShieldAlert className="size-6" />
        </div>
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">You don&apos;t have access to this area</h1>
          <p className="max-w-sm text-sm text-muted-foreground">
            You are signed in to {tenant.name} as {session.user.role === "customer" ? "a customer" : "staff"}. This section is for{" "}
            {role === "customer" ? "customers" : "lending staff"} only.
          </p>
        </div>
        <Link href={`/${tenant.slug}/${HOME_BY_ROLE[session.user.role]}`} className={buttonVariants()}>
          Go to my dashboard
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
