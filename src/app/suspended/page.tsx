import { ShieldAlert } from "lucide-react";

export default function Suspended() {
  return (
    <main className="grid min-h-dvh place-items-center p-6 text-center">
      <div className="max-w-sm">
        <ShieldAlert className="mx-auto mb-4 size-10 text-bad" />
        <h1 className="h-display text-4xl">Account suspended</h1>
        <p className="mt-3 text-mute">Your access has been paused. Please contact support if you think this is a mistake.</p>
        <form action="/auth/signout" method="post" className="mt-6"><button className="btn-ghost">Logout</button></form>
      </div>
    </main>
  );
}
