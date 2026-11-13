"use client";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function SubmitButton({ children, className, pendingText, variant = "primary" }: {
  children: React.ReactNode; className?: string; pendingText?: string; variant?: "primary" | "ghost" | "danger";
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={cn(`btn-${variant}`, className)}>
      {pending && <Loader2 className="size-4 animate-spin" />}
      {pending ? pendingText ?? "Working…" : children}
    </button>
  );
}
