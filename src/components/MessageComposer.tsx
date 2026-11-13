"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import type { ActionResult } from "@/lib/types";

export function MessageComposer({ send, placeholder = "Write a message…" }: { send: (text: string) => Promise<ActionResult>; placeholder?: string }) {
  const [text, setText] = useState("");
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  return (
    <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (!text.trim()) return; start(async () => {
      const r = await send(text);
      if (!r.ok) return toast(r.error, "error");
      setText(""); toast(r.message ?? "Message sent."); router.refresh();
    }); }}>
      <input value={text} onChange={(e) => setText(e.target.value)} maxLength={4000} className="input" placeholder={placeholder} />
      <button disabled={pending || !text.trim()} className="btn-primary h-12 px-4" aria-label="Send">{pending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}</button>
    </form>
  );
}
