import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: ReactNode;
  icon: LucideIcon;
  hint?: ReactNode;
  tone?: "default" | "warning" | "brand";
  className?: string;
}

export function StatCard({ label, value, icon: Icon, hint, tone = "default", className }: StatCardProps) {
  return (
    <Card className={cn("gap-0", tone === "brand" && "bg-primary text-primary-foreground ring-0", className)}>
      <CardContent className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className={cn("text-[11px] font-medium tracking-wide uppercase sm:text-xs", tone === "brand" ? "text-primary-foreground/80" : "text-muted-foreground")}>{label}</p>
          <p className="truncate text-xl font-semibold tracking-tight tabular-nums sm:text-2xl">{value}</p>
          {hint && <div className={cn("text-xs", tone === "brand" ? "text-primary-foreground/80" : "text-muted-foreground")}>{hint}</div>}
        </div>
        <div
          className={cn(
            "hidden size-9 shrink-0 items-center justify-center rounded-lg sm:flex",
            tone === "brand" && "bg-primary-foreground/15",
            tone === "warning" && "bg-red-50 text-red-600",
            tone === "default" && "bg-accent text-primary",
          )}
        >
          <Icon className="size-4.5" />
        </div>
      </CardContent>
    </Card>
  );
}

export function StatCardSkeleton() {
  return (
    <Card className="gap-0">
      <CardContent className="space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-3 w-20" />
      </CardContent>
    </Card>
  );
}
