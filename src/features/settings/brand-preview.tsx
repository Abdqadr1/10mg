import { Bell, Home, Wallet } from "lucide-react";
import { TenantLogo } from "@/components/tenant/tenant-logo";
import { buttonVariants } from "@/components/ui/button";
import { formatMoney } from "@/lib/format";
import { themeStyle } from "@/lib/theme";
import { cn } from "@/lib/utils";
import type { Branding, CurrencyCode } from "@/types";

interface BrandPreviewProps {
  name: string;
  tagline: string;
  logoUrl: string | null;
  branding: Branding;
  currency: CurrencyCode;
}

export function BrandPreview({ name, tagline, logoUrl, branding, currency }: BrandPreviewProps) {
  return (
    <div style={themeStyle(branding)} className="overflow-hidden rounded-xl border bg-background font-sans text-foreground shadow-sm" aria-label="Brand preview">
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <TenantLogo tenant={{ name: name || "Institution", logoUrl, branding }} size="sm" showName />
        <Bell className="ml-auto size-4 text-muted-foreground" />
      </div>
      <div className="space-y-4 p-4">
        <div className="rounded-(--radius) bg-primary p-4 text-primary-foreground">
          <p className="text-xs opacity-80">Outstanding balance</p>
          <p className="text-2xl font-semibold">{formatMoney(184_250, currency)}</p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-primary-foreground/25">
            <div className="h-full w-3/5 rounded-full bg-brand-accent" />
          </div>
          <p className="mt-2 text-xs opacity-80">Next payment due 28 Nov</p>
        </div>
        <p className="text-sm text-muted-foreground">{tagline || "Your tagline appears here."}</p>
        <div className="flex flex-wrap gap-2">
          <span className={cn(buttonVariants(), "pointer-events-none")}>Make a payment</span>
          <span className={cn(buttonVariants({ variant: "outline" }), "pointer-events-none")}>View schedule</span>
        </div>
        <div className="flex items-center gap-2 rounded-(--radius) bg-accent px-3 py-2 text-sm text-accent-foreground">
          <Wallet className="size-4" />
          Your loan is in good standing
          <span className="ml-auto rounded-full bg-brand-accent px-2 py-0.5 text-[10px] font-semibold text-brand-accent-foreground">On track</span>
        </div>
      </div>
      <div className="flex justify-around border-t py-2 text-[11px] text-muted-foreground">
        <span className="flex flex-col items-center gap-0.5 text-primary">
          <Home className="size-4" />
          Home
        </span>
        <span className="flex flex-col items-center gap-0.5">
          <Wallet className="size-4" />
          Loans
        </span>
        <span className="flex flex-col items-center gap-0.5">
          <Bell className="size-4" />
          Alerts
        </span>
      </div>
    </div>
  );
}
