import type { Metadata } from "next";
import {
  Fraunces,
  Inter,
  Noto_Sans_Ethiopic,
  IBM_Plex_Mono,
} from "next/font/google";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});
const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});
const ethiopic = Noto_Sans_Ethiopic({
  subsets: ["ethiopic"],
  weight: ["400", "600", "700"],
  variable: "--font-ethiopic",
  display: "swap",
});
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "sequa Ethiopia",
  description:
    "AI-assisted funding applications and review for Ethiopian small businesses.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${display.variable} ${body.variable} ${ethiopic.variable} ${mono.variable} font-body`}
      >
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
