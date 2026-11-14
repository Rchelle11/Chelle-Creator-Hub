import { DatabaseZap } from "lucide-react";

export const metadata = { title: "Setup needed" };

export default function SetupNeeded() {
  return (
    <main className="grain grid min-h-dvh place-items-center p-6 text-center">
      <div className="max-w-md">
        <DatabaseZap className="mx-auto mb-4 size-10 text-accent" />
        <h1 className="h-display text-4xl">Almost there</h1>
        <p className="mt-3 text-soft">Your account exists, but the database isn&apos;t fully set up yet.</p>
        <p className="mt-2 text-sm text-mute">
          Admin: run <code className="rounded bg-white/10 px-1.5 py-0.5">supabase/migrations</code> SQL files in the Supabase SQL Editor, then refresh this page.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <a href="/dashboard" className="btn-primary">Refresh</a>
          <form action="/auth/signout" method="post"><button className="btn-ghost">Logout</button></form>
        </div>
      </div>
    </main>
  );
}
