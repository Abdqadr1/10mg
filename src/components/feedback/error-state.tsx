import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  error: unknown;
  title?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({ error, title = "Something went wrong", onRetry, className }: ErrorStateProps) {
  const message = error instanceof Error ? error.message : "An unexpected error occurred.";
  return (
    <div role="alert" className={cn("flex flex-col items-center justify-center gap-3 px-6 py-12 text-center", className)}>
      <div className="flex size-11 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="size-5" />
      </div>
      <div className="space-y-1">
        <p className="font-medium">{title}</p>
        <p className="max-w-sm text-sm text-muted-foreground">{message}</p>
      </div>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
