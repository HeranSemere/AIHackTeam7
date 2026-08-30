"use client";

import { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { locales } from "@/lib/i18n/dictionaries";

export default function LanguageSwitcher({ dark = false }: { dark?: boolean }) {
  const { locale, setLocale, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = locales.find((l) => l.code === locale)!;

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition ${
          dark
            ? "border-white/20 text-white hover:bg-white/10"
            : "border-coffee/15 text-coffee hover:bg-coffee/5"
        }`}
      >
        <span aria-hidden>🌐</span>
        <span>{current.nativeLabel}</span>
        <span aria-hidden className={`transition ${open ? "rotate-180" : ""}`}>⌄</span>
      </button>
      {open && (
        <ul
          role="listbox"
          className="absolute right-0 z-30 mt-2 w-44 overflow-hidden rounded-xl border border-coffee/10 bg-paper py-1 shadow-card"
        >
          {locales.map((l) => (
            <li key={l.code}>
              <button
                role="option"
                aria-selected={locale === l.code}
                onClick={() => {
                  setLocale(l.code);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between px-4 py-2 text-left text-sm hover:bg-gold-light/40 ${
                  locale === l.code ? "font-semibold text-coffee" : "text-ink/80"
                }`}
              >
                {l.nativeLabel}
                {locale === l.code && <span aria-hidden>✓</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
