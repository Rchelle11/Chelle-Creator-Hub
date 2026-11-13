"use client";
import { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Kind = "success" | "error" | "info";
type Toast = { id: number; kind: Kind; message: string };
const Ctx = createContext<(message: string, kind?: Kind) => void>(() => {});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((message: string, kind: Kind = "success") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t.slice(-2), { id, kind, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800);
  }, []);
  return (
    <Ctx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-3 z-[100] flex flex-col items-center gap-2 px-4 md:bottom-6 md:top-auto md:items-end">
        {toasts.map((t) => {
          const Icon = t.kind === "success" ? CheckCircle2 : t.kind === "error" ? AlertCircle : Info;
          return (
            <div key={t.id} role="status"
              className="glass pointer-events-auto flex w-full max-w-sm animate-fade-up items-center gap-3 bg-ink-3/90 px-4 py-3 text-sm shadow-2xl">
              <Icon className={cn("size-5 shrink-0", t.kind === "success" ? "text-ok" : t.kind === "error" ? "text-bad" : "text-gold")} />
              <span className="flex-1">{t.message}</span>
              <button aria-label="Dismiss" onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))} className="text-mute hover:text-white">
                <X className="size-4" />
              </button>
            </div>
          );
        })}
      </div>
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);
