import { Zap } from "lucide-react";
import { LocaleSwitcher } from "@/components/locale-switcher/locale-switcher";

export function SiteHeader() {
  return (
    <header className="w-full border-b border-border">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-4 py-4">
        <div className="flex items-center gap-2">
          <Zap className="size-5 text-primary" aria-hidden="true" />
          <span className="text-lg font-semibold tracking-tight">ClipBeam</span>
        </div>
        <LocaleSwitcher />
      </div>
    </header>
  );
}
