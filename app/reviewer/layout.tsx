"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function ReviewerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = useLanguage();
  const pathname = usePathname();

  const nav = [
    { href: "/reviewer", label: t.reviewer.dashboard, icon: "◧" },
    {
      href: "/reviewer/applications",
      label: t.reviewer.applications,
      icon: "☰",
    },
    { href: "/reviewer/shortlist", label: t.reviewer.shortlist, icon: "★" },
  ];

  return (
    <div className="reviewer-shell min-h-screen">
      <div className="mx-auto flex ">
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-navy/10 bg-navy px-4 py-6 text-white sm:flex">
          <Link href="/" className="mb-8 flex items-center gap-2 px-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-sm font-bold">
              FA
            </span>
            <span className="font-display text-sm font-semibold">
              {t.common.fundaiTitle}
            </span>
          </Link>
          <nav className="flex flex-col gap-1">
            {nav.map((n) => {
              const active =
                pathname === n.href ||
                (n.href !== "/reviewer" && pathname.startsWith(n.href));
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                    active
                      ? "bg-white/10 text-white"
                      : "text-white/60 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span aria-hidden>{n.icon}</span>
                  {n.label}
                </Link>
              );
            })}
          </nav>
          <span className="mt-auto px-2 text-xs text-white/30">
            {t.common.reviewerPortal}
          </span>
        </aside>

        <div className="min-h-screen flex-1">
          <header className="flex items-center justify-between border-b border-navy/10 bg-white/60 px-5 py-4 backdrop-blur sm:px-8">
            <span className="font-display text-lg font-semibold text-navy sm:hidden">
              {t.common.fundaiTitle}
            </span>
            <span className="hidden text-sm text-slate sm:block">
              {t.common.reviewerPortal}
            </span>
            <LanguageSwitcher />
          </header>
          <main className="px-5 py-6 sm:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
