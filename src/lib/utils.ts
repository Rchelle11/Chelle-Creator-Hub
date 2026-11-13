import { clsx, type ClassValue } from "clsx";

export const cn = (...v: ClassValue[]) => clsx(v);

export function peso(n: number | string, opts: { decimals?: boolean } = {}) {
  const v = typeof n === "string" ? Number(n) : n;
  return "₱" + v.toLocaleString("en-PH", {
    minimumFractionDigits: opts.decimals && v % 1 !== 0 ? 2 : 0,
    maximumFractionDigits: opts.decimals ? 2 : 0,
  });
}

export function timeAgo(iso: string) {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return "just now";
  const m = Math.floor(s / 60); if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24); if (d < 7) return `${d}d`;
  return new Date(iso).toLocaleDateString("en-PH", { month: "short", day: "numeric" });
}

export const fmtDate = (iso: string, withTime = false) =>
  new Date(iso).toLocaleString("en-PH", { month: "short", day: "numeric", year: "numeric", ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}) });

export function duration(sec: number) {
  const m = Math.floor(sec / 60), s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join("") || "?";

export function parseTags(input: string) {
  return Array.from(new Set(input.split(/[\s,]+/).map((t) => t.replace(/^#/, "").trim()).filter(Boolean))).slice(0, 8);
}

export const lessonCode = (moduleIdx: number, lessonIdx: number) =>
  `MODULE ${moduleIdx} — LESSON ${String(lessonIdx).padStart(2, "0")}`;
