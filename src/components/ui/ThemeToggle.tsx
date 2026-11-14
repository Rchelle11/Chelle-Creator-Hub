"use client";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Dark / light switch. The choice is stored in a `theme` cookie, which the root layout
 * reads to render <html data-theme> on the server, so there is no flash and no client
 * state to hydrate. Icons and labels are swapped purely with CSS (.only-dark / .only-light).
 */
export function ThemeToggle({ className, withLabel }: { className?: string; withLabel?: boolean }) {
  const toggle = () => {
    const root = document.documentElement;
    const next = root.dataset.theme === "light" ? "dark" : "light";
    root.dataset.theme = next;
    document.cookie = `theme=${next}; path=/; max-age=31536000; samesite=lax`;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", next === "light" ? "#f7f2fd" : "#171930");
  };
  return (
    <button type="button" onClick={toggle} aria-label="Switch between dark and light mode" title="Dark / light mode"
      className={cn("inline-flex h-10 items-center justify-center gap-2 rounded-xl px-2.5 text-sm text-soft transition-colors hover:bg-white/[0.06] hover:text-white", !withLabel && "w-10", className)}>
      <Sun className="only-dark size-5" strokeWidth={1.8} />
      <Moon className="only-light size-5" strokeWidth={1.8} />
      {withLabel && <><span className="only-dark">Light mode</span><span className="only-light">Dark mode</span></>}
    </button>
  );
}
