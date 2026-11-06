import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol aria-label="Progress" className="flex items-center gap-2">
      {steps.map((label, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <li key={label} className="flex flex-1 items-center gap-2" aria-current={active ? "step" : undefined}>
            <span
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold",
                done && "border-primary bg-primary text-primary-foreground",
                active && "border-primary text-primary",
                !done && !active && "border-border text-muted-foreground",
              )}
            >
              {done ? <Check className="size-3.5" /> : index + 1}
            </span>
            <span className={cn("hidden text-sm sm:inline", active ? "font-medium" : "text-muted-foreground")}>{label}</span>
            {index < steps.length - 1 && <span className={cn("h-0.5 flex-1 rounded", done ? "bg-primary" : "bg-border")} />}
          </li>
        );
      })}
    </ol>
  );
}
