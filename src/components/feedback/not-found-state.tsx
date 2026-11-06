import Link from "next/link";
import { SearchX } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export function NotFoundState({ title, description, href = "/", cta = "Back to institutions" }: { title: string; description: string; href?: string; cta?: string }) {
  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <SearchX className="size-6" />
      </div>
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Link href={href} className={buttonVariants({ variant: "outline" })}>
        {cta}
      </Link>
    </div>
  );
}
