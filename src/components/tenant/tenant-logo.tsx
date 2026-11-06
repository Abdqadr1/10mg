import Image from "next/image";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/format";
import type { Tenant } from "@/types";

interface TenantLogoProps {
  tenant: Pick<Tenant, "name" | "logoUrl" | "branding">;
  size?: "sm" | "md" | "lg";
  showName?: boolean;
  className?: string;
}

const SIZES = { sm: "size-7 text-xs", md: "size-9 text-sm", lg: "size-14 text-lg" };

export function TenantLogo({ tenant, size = "md", showName = false, className }: TenantLogoProps) {
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-2.5", className)}>
      {tenant.logoUrl ? (
        <Image
          src={tenant.logoUrl}
          alt={`${tenant.name} logo`}
          width={56}
          height={56}
          unoptimized
          className={cn("shrink-0 rounded-md object-contain", SIZES[size])}
        />
      ) : (
        <span
          aria-label={`${tenant.name} logo`}
          className={cn("flex shrink-0 items-center justify-center rounded-md font-semibold", SIZES[size])}
          style={{ backgroundColor: tenant.branding.primary, color: "#fff" }}
        >
          {initials(tenant.name)}
        </span>
      )}
      {showName && <span className="truncate font-semibold tracking-tight">{tenant.name}</span>}
    </span>
  );
}
