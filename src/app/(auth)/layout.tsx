import { Logo } from "@/components/ui/Logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="grain relative flex min-h-dvh flex-col">
      <div className="px-5 pt-[max(env(safe-area-inset-top),1.25rem)] md:px-8"><Logo /></div>
      <div className="relative z-10 flex flex-1 items-center justify-center px-5 py-10">
        <div className="w-full max-w-[400px] animate-fade-up">{children}</div>
      </div>
    </main>
  );
}
