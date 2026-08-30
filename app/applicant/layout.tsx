"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function ApplicantLayout({ children }: { children: React.ReactNode }) {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-cream">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-coffee/10 bg-cream/90 px-5 py-4 backdrop-blur sm:px-8">
        <Link href="/applicant" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold text-sm font-bold text-white">FA</span>
          <span className="font-display text-base font-semibold text-coffee">{t.common.fundaiTitle}</span>
        </Link>
        <LanguageSwitcher />
      </header>
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-6 sm:px-8">{children}</main>
    </div>
  );
}
