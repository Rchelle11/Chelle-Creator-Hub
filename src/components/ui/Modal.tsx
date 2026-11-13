"use client";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Modal({ open, onClose, title, children, className }: {
  open: boolean; onClose: () => void; title?: string; children: React.ReactNode; className?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [open, onClose]);
  if (!open || typeof document === "undefined") return null;
  // Portal to <body> so the sheet escapes layout stacking contexts (e.g. sits above the bottom nav).
  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-end justify-center md:items-center" role="dialog" aria-modal="true">
      <button aria-label="Close" className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className={cn(
        "relative flex max-h-[88dvh] w-full animate-fade-up flex-col rounded-t-3xl border border-line bg-ink-2 shadow-2xl md:max-w-lg md:rounded-3xl",
        className)}>
        <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-white/15 md:hidden" />
        {title && (
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="text-base font-semibold">{title}</h2>
            <button onClick={onClose} aria-label="Close" className="btn-quiet btn-sm -mr-2 px-2"><X className="size-5" /></button>
          </div>
        )}
        <div className="overflow-y-auto overscroll-contain p-5 pb-safe">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
