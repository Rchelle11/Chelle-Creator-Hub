"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { joinChallenge } from "@/lib/actions/challenges";

export function JoinButton({ id }: { id: string }) {
  const toast = useToast();
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button disabled={pending} className="btn-primary w-full sm:w-auto" onClick={() => start(async () => {
      const r = await joinChallenge(id);
      if (!r.ok) return toast(r.error, "error");
      toast("You're in! Let's create."); router.refresh();
    })}>{pending && <Loader2 className="size-4 animate-spin" />} Join Challenge</button>
  );
}
