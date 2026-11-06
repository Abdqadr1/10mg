import Link from "next/link";
import { Layers } from "lucide-react";
import { cn } from "@/lib/utils";

export function PlatformHeader({ active }: { active?: "institutions" | "onboard" }) {
  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="flex size-7 items-center justify-center rounded-md bg-neutral-900 text-white">
            <Layers className="size-4" />
          </span>
          10MG Credit
          <span className="hidden rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-neutral-600 sm:inline">V2</span>
        </Link>
        <nav className="ml-auto flex items-center gap-1 text-sm">
          <Link href="/" className={cn("rounded-md px-3 py-1.5 hover:bg-neutral-100", active === "institutions" && "bg-neutral-100 font-medium")}>
            Institutions
          </Link>
          <Link href="/platform" className={cn("rounded-md px-3 py-1.5 hover:bg-neutral-100", active === "onboard" && "bg-neutral-100 font-medium")}>
            Onboard
          </Link>
        </nav>
      </div>
    </header>
  );
}
