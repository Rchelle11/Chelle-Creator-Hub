import type { Metadata, Viewport } from "next";
import { Inter, Instrument_Serif } from "next/font/google";
import { ToastProvider } from "@/components/ui/Toast";
import { RegisterSW } from "@/components/RegisterSW";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const serif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-serif-display", display: "swap" });

export const metadata: Metadata = {
  title: { default: "ROCHELLE OS — Short Video Masterclass", template: "%s · ROCHELLE OS" },
  description: "Learn how to plan, create, edit, and publish engaging short-form videos using AI and modern editing techniques.",
  applicationName: "ROCHELLE OS",
  appleWebApp: { capable: true, title: "ROCHELLE OS", statusBarStyle: "black-translucent" },
  icons: { icon: "/icons/icon-192.png", apple: "/icons/apple-touch-icon.png" },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
};

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${serif.variable}`}>
      <body className="min-h-dvh font-sans">
        <ToastProvider>{children}</ToastProvider>
        <RegisterSW />
      </body>
    </html>
  );
}
