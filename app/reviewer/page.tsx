"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { fetchReviewerApplications } from "@/lib/api";
import { Application } from "@/lib/types";
import { LoadingState, ErrorState } from "@/components/RequestState";
import { EligibilityPill } from "@/components/ScoreBits";

export default function ReviewerDashboard() {
  const { t } = useLanguage();
  const [apps, setApps] = useState<Application[] | null>(null);
  const [error, setError] = useState<unknown>(null);

  function load() {
    setError(null);
    setApps(null);
    fetchReviewerApplications().then(setApps).catch(setError);
  }

  useEffect(load, []);

  if (error) return <ErrorState error={error} onRetry={load} />;
  if (!apps) return <LoadingState />;

  const total = apps.length;
  const eligible = apps.filter(
    (a) => a.eligibility.status === "eligible",
  ).length;
  const notEligible = apps.filter(
    (a) => a.eligibility.status === "notEligible",
  ).length;
  const needsReview = apps.filter(
    (a) =>
      a.status === "needsReview" &&
      (a.contradictions.length > 0 || a.missing.length > 0),
  ).length;
  const avg = total
    ? Math.round(apps.reduce((s, a) => s + a.finalScore, 0) / total)
    : 0;

  const needsAttention = apps.filter(
    (a) => a.contradictions.length > 0 || a.missing.length > 0,
  );
  const topRanked = [...apps]
    .sort((a, b) => b.finalScore - a.finalScore)
    .slice(0, 3);

  const cards = [
    { label: t.reviewer.totalApplications, value: total },
    { label: t.reviewer.eligible, value: eligible },
    // { label: t.reviewer.notEligible, value: notEligible },
    // { label: t.reviewer.needsReview, value: needsReview },
    // { label: t.reviewer.averageScore, value: avg },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-navy">
        {t.reviewer.dashboard}
      </h1>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-xl2 border border-navy/10 bg-white p-5 shadow-card"
          >
            <p className="font-display text-3xl font-semibold text-navy">
              {c.value}
            </p>
            <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate">
              {c.label}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl2 border border-navy/10 bg-white p-6 shadow-card">
          <h2 className="font-display text-lg font-semibold text-navy">
            Applications needing attention
          </h2>
          <ul className="mt-4 flex flex-col gap-3">
            {needsAttention.length === 0 && (
              <p className="text-sm text-slate">
                Nothing needs attention right now.
              </p>
            )}
            {needsAttention.map((a) => (
              <li key={a.id}>
                <Link
                  href={`/reviewer/applications/${a.id}`}
                  className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-navy-soft"
                >
                  <span className="text-sm font-medium text-navy">
                    {a.businessName}
                  </span>
                  <span className="text-xs text-slate">
                    {a.contradictions.length > 0 &&
                      `${a.contradictions.length} contradiction${a.contradictions.length > 1 ? "s" : ""}`}
                    {a.contradictions.length > 0 &&
                      a.missing.length > 0 &&
                      " · "}
                    {a.missing.length > 0 && `${a.missing.length} missing`}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl2 border border-navy/10 bg-white p-6 shadow-card">
          <h2 className="font-display text-lg font-semibold text-navy">
            Top-ranked applications
          </h2>
          <ul className="mt-4 flex flex-col gap-3">
            {topRanked.map((a, i) => (
              <li key={a.id}>
                <Link
                  href={`/reviewer/applications/${a.id}`}
                  className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-navy-soft"
                >
                  <span className="flex items-center gap-3 text-sm font-medium text-navy">
                    <span className="text-lg">{["🥇", "🥈", "🥉"][i]}</span>
                    {a.businessName}
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-navy">
                      {a.finalScore}/100
                    </span>
                    <EligibilityPill status={a.eligibility.status} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
