"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function Home() {
  const { t } = useLanguage();
  return (
    <main className="min-h-screen bg-cream">
      <header className="flex items-center justify-between px-6 py-6 sm:px-10">
        <span className="font-display text-lg font-semibold text-coffee">
          {t.common.fundaiTitle}
        </span>
        <LanguageSwitcher />
      </header>

      <section className="mx-auto max-w-3xl px-6 pb-24 pt-6 text-center sm:pt-16">
        <div
          className="mx-auto mb-6 flex h-14 items-end justify-center gap-1"
          aria-hidden
        >
          {[0.4, 0.7, 1, 0.55, 0.85, 0.3, 0.65].map((d, i) => (
            <span
              key={i}
              className="wave-bar w-1.5 rounded-full bg-gold"
              style={{ height: `${d * 56}px`, animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>
        <h1 className="font-display text-4xl font-semibold text-ink sm:text-5xl">
          {t.common.fundaiTitle}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-balance text-ink/60">
          {t.common.portalPicker}
        </p>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          <Link
            href="/applicant"
            className="group flex flex-col rounded-xl2 border border-coffee/10 bg-paper p-8 text-left shadow-card transition hover:-translate-y-0.5 hover:border-gold"
          >
            <span className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-gold-light text-xl">
              🎙️
            </span>
            <span className="font-display text-xl font-semibold text-coffee">
              {t.common.applicantPortal}
            </span>
            <span className="mt-2 text-sm text-ink/60">
              {t.common.applicantPortalDesc}
            </span>
            <span className="mt-6 text-sm font-semibold text-gold-dark group-hover:underline">
              {t.common.continue} →
            </span>
          </Link>

          <Link
            href="/reviewer"
            className="group flex flex-col rounded-xl2 border border-navy/10 bg-paper p-8 text-left shadow-card transition hover:-translate-y-0.5 hover:border-navy"
          >
            <span className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-navy-soft text-xl">
              📋
            </span>
            <span className="font-display text-xl font-semibold text-navy">
              {t.common.reviewerPortal}
            </span>
            <span className="mt-2 text-sm text-ink/60">
              {t.common.reviewerPortalDesc}
            </span>
            <span className="mt-6 text-sm font-semibold text-navy group-hover:underline">
              {t.common.continue} →
            </span>
          </Link>
        </div>
      </section>
    </main>
  );
}
