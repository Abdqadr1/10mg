import { Loader2 } from "lucide-react";

export function FullPageLoader({ label = "Loading" }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex min-h-dvh flex-col items-center justify-center gap-3 text-muted-foreground">
      <Loader2 className="size-6 animate-spin text-primary" />
      <span className="text-sm">{label}…</span>
    </div>
  );
}
