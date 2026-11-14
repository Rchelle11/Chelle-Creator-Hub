"use client";
import { useActionState, useState } from "react";
import { AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { SubmitButton } from "@/components/ui/SubmitButton";
import type { AuthState } from "./actions";

export function AuthForm({ action, fields, submit, pending, next, footer }: {
  action: (s: AuthState, f: FormData) => Promise<AuthState>;
  fields: { name: string; label: string; type?: string; placeholder?: string; autoComplete?: string }[];
  submit: string; pending: string; next?: string; footer?: React.ReactNode;
}) {
  const [state, formAction] = useActionState(action, undefined);
  const [show, setShow] = useState(false);
  return (
    <form action={formAction} className="space-y-4">
      {next && <input type="hidden" name="next" value={next} />}
      {fields.map((f) => (
        <div key={f.name}>
          <label htmlFor={f.name} className="label">{f.label}</label>
          <div className="relative">
            <input id={f.name} name={f.name} type={f.type === "password" && show ? "text" : f.type ?? "text"} required placeholder={f.placeholder}
              autoComplete={f.autoComplete} className={f.type === "password" ? "input pr-12" : "input"} />
            {f.type === "password" && (
              <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? "Hide password" : "Show password"} aria-pressed={show}
                className="absolute right-1 top-1 grid size-10 place-items-center rounded-lg text-mute transition hover:text-white">
                {show ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
              </button>
            )}
          </div>
        </div>
      ))}
      {state?.error && <p className="flex items-center gap-2 rounded-xl border border-bad/25 bg-bad/10 px-3 py-2.5 text-sm text-bad"><AlertCircle className="size-4" />{state.error}</p>}
      {state?.message && <p className="flex items-center gap-2 rounded-xl border border-ok/25 bg-ok/10 px-3 py-2.5 text-sm text-ok"><CheckCircle2 className="size-4" />{state.message}</p>}
      <SubmitButton className="h-12 w-full" pendingText={pending}>{submit}</SubmitButton>
      {footer}
    </form>
  );
}
