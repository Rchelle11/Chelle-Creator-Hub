"use client";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2 } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { useToast } from "@/components/ui/Toast";
import { changePassword, updateProfile, updateSettings } from "@/lib/actions/account";
import { compressImage, uniqueName, uploadFile } from "@/lib/upload";
import type { Profile } from "@/lib/types";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export function ProfileForm({ profile, email }: { profile: Profile; email: string }) {
  const toast = useToast();
  const router = useRouter();
  const [avatar, setAvatar] = useState(profile.avatar_url);
  const [uploading, setUploading] = useState(false);
  const [pending, start] = useTransition();
  const input = useRef<HTMLInputElement>(null);

  async function onAvatar(f?: File) {
    if (!f) return;
    setUploading(true);
    try {
      const blob = await compressImage(f, 512, 0.85);
      const { publicUrl } = await uploadFile("avatars", `${profile.id}/${uniqueName("jpg")}`, blob);
      const r = await updateProfile({ full_name: profile.full_name, bio: profile.bio, avatar_url: publicUrl });
      if (!r.ok) throw new Error(r.error);
      setAvatar(publicUrl); toast("Profile photo updated."); router.refresh();
    } catch (e) { toast(e instanceof Error ? e.message : "Upload failed", "error"); }
    setUploading(false);
  }

  return (
    <form className="space-y-4" action={(f) => start(async () => {
      const r = await updateProfile({ full_name: String(f.get("full_name")), bio: String(f.get("bio")) });
      if (r.ok) { toast("Profile saved."); router.refresh(); } else toast(r.error, "error");
    })}>
      <div className="flex items-center gap-4">
        <button type="button" onClick={() => input.current?.click()} className="group relative" aria-label="Change profile photo">
          <Avatar name={profile.full_name} src={avatar} size={76} />
          <span className="absolute inset-0 grid place-items-center rounded-full text-pure bg-black/50 opacity-0 transition group-hover:opacity-100">
            {uploading ? <Loader2 className="size-5 animate-spin" /> : <Camera className="size-5" />}
          </span>
        </button>
        <input ref={input} type="file" accept="image/*" className="hidden" onChange={(e) => onAvatar(e.target.files?.[0])} />
        <div className="text-sm"><p className="font-semibold">Profile photo</p><p className="text-mute">Tap to change</p></div>
      </div>
      <div><label className="label">Name</label><input name="full_name" defaultValue={profile.full_name} required className="input" /></div>
      <div><label className="label">Email</label><input value={email} disabled className="input opacity-60" /></div>
      <div><label className="label">Bio</label><textarea name="bio" defaultValue={profile.bio} maxLength={280} rows={3} className="input" placeholder="What do you create?" /></div>
      <button disabled={pending} className="btn-primary">{pending && <Loader2 className="size-4 animate-spin" />} Save profile</button>
    </form>
  );
}

export function SettingsForm({ profile }: { profile: Profile }) {
  const toast = useToast();
  const [s, setS] = useState({ notify_email: profile.notify_email, notify_push: profile.notify_push, is_private: profile.is_private });
  const [pw, setPw] = useState("");
  const [pending, start] = useTransition();
  const toggle = (k: keyof typeof s) => {
    const next = { ...s, [k]: !s[k] }; setS(next);
    start(async () => { const r = await updateSettings(next); if (r.ok) toast("Settings saved."); else { toast(r.error, "error"); setS(s); } });
  };
  return (
    <div className="space-y-6">
      <div className="divide-y divide-line">
        <div className="flex items-center justify-between gap-4 py-3"><span><span className="block text-sm font-medium">Appearance</span><span className="block text-xs text-mute">Switch between dark and light mode.</span></span><ThemeToggle withLabel className="border border-line" /></div>
        <Row s={s} toggle={toggle} pending={pending} k="notify_email" title="Email notifications" desc="Payment updates, announcements and feedback." />
        <Row s={s} toggle={toggle} pending={pending} k="notify_push" title="In-app notifications" desc="Likes, comments and challenge reminders." />
        <Row s={s} toggle={toggle} pending={pending} k="is_private" title="Private profile" desc="Hide your stats and work from other students." />
      </div>
      <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); start(async () => {
        const r = await changePassword(pw); if (r.ok) { toast("Password updated."); setPw(""); } else toast(r.error, "error");
      }); }}>
        <label className="label">Change password</label>
        <div className="flex gap-2">
          <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" minLength={8} className="input" placeholder="New password" />
          <button disabled={pending || pw.length < 8} className="btn-ghost h-12">Update</button>
        </div>
      </form>
    </div>
  );
}

type Settings = { notify_email: boolean; notify_push: boolean; is_private: boolean };
function Row({ k, title, desc, s, toggle, pending }: { k: keyof Settings; title: string; desc: string; s: Settings; toggle: (k: keyof Settings) => void; pending: boolean }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 py-3">
      <span><span className="block text-sm font-medium">{title}</span><span className="block text-xs text-mute">{desc}</span></span>
      <input type="checkbox" checked={s[k]} onChange={() => toggle(k)} disabled={pending} className="peer sr-only" />
      <span className="relative h-7 w-12 shrink-0 rounded-full bg-white/10 transition after:absolute after:left-1 after:top-1 after:size-5 after:rounded-full after:bg-pure after:transition peer-checked:bg-accent peer-checked:after:translate-x-5" />
    </label>
  );
}
