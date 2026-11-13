"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import type { ActionResult } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Calls a (bound) server action, toasts the result and refreshes the page. */
export function ActionButton({ action, children, className = "btn-ghost btn-sm", confirm: confirmText, title }: {
  action: () => Promise<ActionResult<unknown>>; children: React.ReactNode; className?: string; confirm?: string; title?: string;
}) {
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  return (
    <button type="button" title={title} disabled={pending} className={cn(className)}
      onClick={() => {
        if (confirmText && !window.confirm(confirmText)) return;
        start(async () => {
          const r = await action();
          if (r.ok) { if (r.message) toast(r.message); router.refresh(); } else toast(r.error, "error");
        });
      }}>
      {pending ? <Loader2 className="size-4 animate-spin" /> : children}
    </button>
  );
}
