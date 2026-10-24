import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

const title = "Bassline — find, see and hear scales on the bass neck";
const description =
  "Pick notes, get scale suggestions, see them on a 4-string bass fretboard, hear them played, and ask an AI coach for scale ideas over any progression.";

export const metadata: Metadata = {
  title,
  description,
  applicationName: "Bassline",
  keywords: ["bass", "bass guitar", "scales", "fretboard", "music theory", "practice"],
  openGraph: { title, description, type: "website", siteName: "Bassline" },
  twitter: { card: "summary", title, description },
};

export const viewport: Viewport = {
  themeColor: "#16171a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} h-full antialiased`}>
      <body className="min-h-full bg-bg font-sans text-fg">{children}</body>
    </html>
  );
}
