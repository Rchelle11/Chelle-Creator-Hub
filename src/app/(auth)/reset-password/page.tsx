import { AuthForm } from "../AuthForm";
import { resetPassword } from "../actions";

export const metadata = { title: "New Password" };
export default function ResetPage() {
  return (
    <>
      <h1 className="h-display mb-8 text-5xl">Set a new password.</h1>
      <AuthForm action={resetPassword} submit="Update password" pending="Saving…"
        fields={[
          { name: "password", label: "New password", type: "password", autoComplete: "new-password" },
          { name: "confirm", label: "Confirm password", type: "password", autoComplete: "new-password" },
        ]} />
    </>
  );
}
