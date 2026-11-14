import Link from "next/link";
import { AuthForm } from "../AuthForm";
import { signup } from "../actions";

export const metadata = { title: "Sign Up" };
export default async function SignupPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <>
      <p className="eyebrow mb-3">Join CHELLE CREATOR HUB</p>
      <h1 className="h-display mb-8 text-5xl">Your creator studio awaits.</h1>
      <AuthForm action={signup} next={next} submit="Create Account" pending="Creating your studio…"
        fields={[
          { name: "name", label: "Full name", placeholder: "Juan Dela Cruz", autoComplete: "name" },
          { name: "email", label: "Email", type: "email", placeholder: "you@email.com", autoComplete: "email" },
          { name: "password", label: "Password", type: "password", placeholder: "At least 8 characters", autoComplete: "new-password" },
          { name: "confirm", label: "Confirm password", type: "password", placeholder: "Repeat password", autoComplete: "new-password" },
        ]}
        footer={
          <p className="pt-2 text-center text-sm text-mute">
            Already have an account? <Link href={`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold text-accent">Login</Link>
          </p>
        } />
    </>
  );
}
