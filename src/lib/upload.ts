"use client";
import { createClient } from "./supabase/client";
import { browserSupabaseUrl } from "./supabase/env";

export type Bucket = "receipts" | "bottle" | "avatars" | "course-media" | "public-assets";

/** Upload straight to Supabase Storage with real progress events (XHR). */
export async function uploadFile(
  bucket: Bucket, path: string, file: Blob, onProgress?: (pct: number) => void,
): Promise<{ path: string; publicUrl: string }> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Please sign in again.");

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${browserSupabaseUrl()}/storage/v1/object/${bucket}/${path.split("/").map(encodeURIComponent).join("/")}`);
    xhr.setRequestHeader("Authorization", `Bearer ${session.access_token}`);
    xhr.setRequestHeader("x-upsert", "false");
    xhr.setRequestHeader("cache-control", "max-age=31536000");
    if (file.type) xhr.setRequestHeader("Content-Type", file.type);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) return resolve();
      let msg = "Upload failed";
      try { msg = JSON.parse(xhr.responseText).message ?? msg; } catch {}
      reject(new Error(msg));
    };
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(file);
  });

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { path, publicUrl: data.publicUrl };
}

export function fileExt(file: File, fallback = "bin") {
  return (file.name.split(".").pop() || fallback).toLowerCase().replace(/[^a-z0-9]/g, "") || fallback;
}

export const uniqueName = (ext: string) => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

/** Downscale + re-encode images (receipts, avatars) before upload. */
export async function compressImage(file: File, maxSize = 1600, quality = 0.85): Promise<Blob> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", quality));
    return blob && blob.size < file.size ? blob : file;
  } catch {
    return file;
  }
}

/** Grab a poster frame from a local video so the feed can lazy-load videos. */
export function videoPoster(file: File): Promise<{ blob: Blob | null; width: number; height: number; duration: number }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement("video");
    v.muted = true; v.playsInline = true; v.preload = "metadata"; v.src = url;
    let finished = false;
    const done = (blob: Blob | null) => {
      if (finished) return;
      finished = true;
      const meta = { blob, width: v.videoWidth, height: v.videoHeight, duration: v.duration || 0 };
      v.onerror = null; v.removeAttribute("src"); v.load(); URL.revokeObjectURL(url);
      resolve(meta);
    };
    v.onloadeddata = () => { v.currentTime = Math.min(0.5, (v.duration || 1) / 2); };
    v.onseeked = () => {
      const scale = Math.min(1, 720 / Math.max(v.videoWidth, v.videoHeight));
      const c = document.createElement("canvas");
      c.width = Math.round(v.videoWidth * scale); c.height = Math.round(v.videoHeight * scale);
      c.getContext("2d")!.drawImage(v, 0, 0, c.width, c.height);
      c.toBlob((b) => done(b), "image/jpeg", 0.8);
    };
    v.onerror = () => done(null);
    setTimeout(() => done(null), 8000);
  });
}
