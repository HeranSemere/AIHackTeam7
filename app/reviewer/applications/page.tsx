"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { fetchReviewerApplications } from "@/lib/api";
import { Application } from "@/lib/types";
import { LoadingState, ErrorState } from "@/components/RequestState";
import { EligibilityPill } from "@/components/ScoreBits";

type FilterKey =
  | "all"
  | "eligible"
  | "notEligible"
  | "missing"
  | "contradictions"
  | "needsReview";
type SortKey = "scoreDesc" | "scoreAsc";

export default function ApplicationsList() {
  const { t } = useLanguage();
  const [apps, setApps] = useState<Application[] | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [sort, setSort] = useState<SortKey>("scoreDesc");

  function load() {
    setError(null);
    setApps(null);
    fetchReviewerApplications().then(setApps).catch(setError);
  }

  useEffect(load, []);

  const filters: { key: FilterKey; label: string }[] = [
    { key: "all", label: "All" },
    { key: "eligible", label: t.reviewer.eligible },
    { key: "notEligible", label: t.reviewer.notEligible },
    { key: "missing", label: t.applicant.missingInfo },
    { key: "contradictions", label: t.reviewer.contradictions },
    { key: "needsReview", label: t.reviewer.needsReview },
  ];

  const rows = useMemo(() => {
    if (!apps) return [];
    let list = apps.filter(
      (a) =>
        a.businessName.toLowerCase().includes(query.toLowerCase()) ||
        a.owner.toLowerCase().includes(query.toLowerCase()) ||
        a.sector.toLowerCase().includes(query.toLowerCase()),
    );
    if (filter === "eligible")
      list = list.filter((a) => a.eligibility.status === "eligible");
    if (filter === "notEligible")
      list = list.filter((a) => a.eligibility.status === "notEligible");
    if (filter === "missing") list = list.filter((a) => a.missing.length > 0);
    if (filter === "contradictions")
      list = list.filter((a) => a.contradictions.length > 0);
    if (filter === "needsReview")
      list = list.filter((a) => a.status === "needsReview");

    return [...list].sort((a, b) =>
      sort === "scoreDesc"
        ? b.finalScore - a.finalScore
        : a.finalScore - b.finalScore,
    );
  }, [apps, query, filter, sort]);

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-navy">
        {t.reviewer.applications}
      </h1>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.reviewer.search}
          className="w-full max-w-xs rounded-full border border-navy/15 bg-white px-4 py-2 text-sm text-navy placeholder:text-slate/60 focus:border-navy"
        />
        <button
          onClick={() =>
            setSort((s) => (s === "scoreDesc" ? "scoreAsc" : "scoreDesc"))
          }
          className="rounded-full border border-navy/15 bg-white px-4 py-2 text-sm font-medium text-navy hover:border-navy"
        >
          {t.reviewer.score} {sort === "scoreDesc" ? "↓" : "↑"}
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
              filter === f.key
                ? "bg-navy text-white"
                : "bg-white text-slate hover:bg-navy-soft"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mt-5">
          <ErrorState error={error} onRetry={load} />
        </div>
      )}

      {!error && !apps && <LoadingState />}

      {apps && (
        <div className="mt-5 overflow-x-auto rounded-xl2 border border-navy/10 bg-white shadow-card">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-navy/10 text-xs font-semibold uppercase tracking-wide text-slate">
                <th className="px-4 py-3">{t.reviewer.rank}</th>
                <th className="px-4 py-3">{t.reviewer.business}</th>
                <th className="px-4 py-3">{t.reviewer.sector}</th>
                <th className="px-4 py-3">{t.reviewer.score}</th>
                <th className="px-4 py-3">{t.reviewer.eligibility}</th>
                <th className="px-4 py-3">{t.reviewer.issues}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a, i) => {
                const issues = a.contradictions.length + a.missing.length;
                return (
                  <tr
                    key={a.id}
                    className="border-b border-navy/5 last:border-0 hover:bg-navy-soft"
                  >
                    <td className="px-4 py-3 font-semibold text-navy">
                      {i + 1}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/reviewer/applications/${a.id}`}
                        className="font-semibold text-navy hover:underline"
                      >
                        {a.businessName}
                      </Link>
                      <p className="text-xs text-slate">{a.owner}</p>
                    </td>
                    <td className="px-4 py-3 text-slate">{a.sector}</td>
                    <td className="px-4 py-3 font-semibold text-navy">
                      {a.finalScore}/100
                    </td>
                    <td className="px-4 py-3">
                      <EligibilityPill status={a.eligibility.status} />
                    </td>
                    <td className="px-4 py-3">
                      {issues === 0 ? (
                        <span className="text-forest">0 Issues</span>
                      ) : (
                        <span className="text-amber">
                          {issues} Issue{issues > 1 ? "s" : ""}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate">
                    No applications match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
