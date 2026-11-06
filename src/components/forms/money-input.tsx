import type { ComponentProps } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function MoneyInput({ symbol, className, ...props }: ComponentProps<"input"> & { symbol: string }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">{symbol}</span>
      <Input type="number" inputMode="decimal" step="any" min={0} className={cn("h-10 pl-9 tabular-nums", className)} {...props} />
    </div>
  );
}
