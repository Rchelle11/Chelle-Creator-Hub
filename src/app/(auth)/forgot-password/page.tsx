import Link from "next/link";
import { AuthForm } from "../AuthForm";
import { forgotPassword } from "../actions";

export const metadata = { title: "Forgot Password" };
export default function ForgotPage() {
  return (
    <>
      <p className="eyebrow mb-3">Reset access</p>
      <h1 className="h-display mb-8 text-5xl">Forgot your password?</h1>
      <AuthForm action={forgotPassword} submit="Send reset link" pending="Sending…"
        fields={[{ name: "email", label: "Email", type: "email", placeholder: "you@email.com", autoComplete: "email" }]}
        footer={<p className="pt-2 text-center text-sm"><Link href="/login" className="text-mute hover:text-white">Back to login</Link></p>} />
    </>
  );
}
