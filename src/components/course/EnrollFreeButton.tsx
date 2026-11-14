"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { enrollFree } from "@/lib/actions/learning";
import { cn } from "@/lib/utils";

/** One-tap enrollment for free courses (price = 0). */
export function EnrollFreeButton({ courseId, href, className, label = "Start for free" }: {
  courseId: string; href: string; className?: string; label?: string;
}) {
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  return (
    <button disabled={pending} className={cn("btn-primary", className)} onClick={() => start(async () => {
      const r = await enrollFree(courseId);
      if (!r.ok) return toast(r.error, "error");
      toast("You're in! Enjoy the free lessons.");
      router.push(href); router.refresh();
    })}>
      {pending ? <Loader2 className="size-4 animate-spin" /> : null}{label} <ArrowRight className="size-4" />
    </button>
  );
}
