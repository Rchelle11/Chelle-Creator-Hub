import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grain grid min-h-dvh place-items-center p-6 text-center">
      <div>
        <p className="eyebrow">404</p>
        <h1 className="h-display mt-3 text-5xl">This scene was cut.</h1>
        <p className="mt-3 text-mute">The page you&apos;re looking for doesn&apos;t exist.</p>
        <Link href="/dashboard" className="btn-primary mt-6">Back to your studio</Link>
      </div>
    </main>
  );
}
