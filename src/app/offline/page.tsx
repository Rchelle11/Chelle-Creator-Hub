import { WifiOff } from "lucide-react";

export const metadata = { title: "Offline" };
export default function Offline() {
  return (
    <main className="grid min-h-dvh place-items-center p-6 text-center">
      <div>
        <WifiOff className="mx-auto mb-4 size-10 text-accent" />
        <h1 className="h-display text-4xl">You&apos;re offline</h1>
        <p className="mt-2 text-mute">Reconnect to keep creating. Your progress is saved.</p>
      </div>
    </main>
  );
}
