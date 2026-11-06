"use client";

import { useEffect, useState, type ReactNode } from "react";
import { FullPageLoader } from "@/components/feedback/full-page-loader";

const mockingEnabled = process.env.NEXT_PUBLIC_API_MOCKING !== "disabled";

let workerStart: Promise<unknown> | null = null;

function startWorker() {
  workerStart ??= import("@/mocks/browser").then(({ worker }) =>
    worker.start({
      onUnhandledFrame: "bypass",
      quiet: true,
      serviceWorker: { url: "/mockServiceWorker.js" },
    }),
  );
  return workerStart;
}

export function MockApiGate({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(!mockingEnabled);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!mockingEnabled) return;
    startWorker()
      .then(() => setReady(true))
      .catch(() => setFailed(true));
  }, []);

  if (failed) {
    return (
      <div className="flex min-h-dvh items-center justify-center p-6 text-center text-sm text-muted-foreground">
        The demo API could not start. Service workers may be disabled in this browser (e.g. private mode).
      </div>
    );
  }
  if (!ready) return <FullPageLoader label="Starting 10MG Credit" />;
  return <>{children}</>;
}
