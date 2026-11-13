import Link from "next/link";
import { AuthForm } from "../AuthForm";
import { login } from "../actions";

export const metadata = { title: "Login" };
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <>
      <p className="eyebrow mb-3">Welcome back</p>
      <h1 className="h-display mb-8 text-5xl">Enter your studio.</h1>
      <AuthForm action={login} next={next} submit="Login" pending="Signing in…"
        fields={[
          { name: "email", label: "Email", type: "email", placeholder: "you@email.com", autoComplete: "email" },
          { name: "password", label: "Password", type: "password", placeholder: "••••••••", autoComplete: "current-password" },
        ]}
        footer={
          <div className="flex items-center justify-between pt-2 text-sm">
            <Link href="/forgot-password" className="text-mute hover:text-white">Forgot Password</Link>
            <Link href={`/signup${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold text-accent">Create account</Link>
          </div>
        } />
    </>
  );
}
