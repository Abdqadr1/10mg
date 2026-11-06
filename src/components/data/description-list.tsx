import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface DescriptionItem {
  label: string;
  value: ReactNode;
}

export function DescriptionList({ items, className, columns = 2 }: { items: DescriptionItem[]; className?: string; columns?: 1 | 2 | 3 }) {
  return (
    <dl className={cn("grid gap-x-6 gap-y-4", columns === 2 && "sm:grid-cols-2", columns === 3 && "sm:grid-cols-2 lg:grid-cols-3", className)}>
      {items.map((item) => (
        <div key={item.label} className="min-w-0 space-y-0.5">
          <dt className="text-xs text-muted-foreground">{item.label}</dt>
          <dd className="truncate text-sm font-medium">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
