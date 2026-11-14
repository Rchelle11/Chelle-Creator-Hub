import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ROCHELLE OS — Short Video Masterclass",
    short_name: "ROCHELLE OS",
    description: "Learn. Create. Edit. Publish. Your private creator studio.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#09090b",
    theme_color: "#09090b",
    categories: ["education", "photo", "video"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Continue learning", url: "/courses" },
      { name: "Battles", url: "/battles" },
      { name: "Post a video", url: "/battles/new" },
    ],
  };
}
