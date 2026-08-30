"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { fetchReviewerApplications, setShortlisted } from "@/lib/api";
import { Application } from "@/lib/types";
import { LoadingState, ErrorState } from "@/components/RequestState";

export default function ShortlistPage() {
  const { t } = useLanguage();
  const [apps, setApps] = useState<Application[] | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  function load() {
    setError(null);
    setApps(null);
    fetchReviewerApplications().then(setApps).catch(setError);
  }

  useEffect(load, []);

  async function toggle(app: Application) {
    setBusyId(app.id);
    try {
      const updated = await setShortlisted(app.id, !app.shortlisted);
      setApps((prev) => prev!.map((a) => (a.id === updated.id ? updated : a)));
    } catch (err) {
      setError(err);
    } finally {
      setBusyId(null);
    }
  }

  if (error) return <ErrorState error={error} onRetry={load} />;
  if (!apps) return <LoadingState />;

  const ranked = [...apps].filter((a) => a.eligibility.status !== "notEligible").sort((a, b) => b.finalScore - a.finalScore);

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-navy">Recommended Shortlist</h1>
      <p className="mt-1 text-sm text-slate">AI-ranked, reviewer-confirmed.</p>

      <div className="mt-6 flex flex-col gap-3">
        {ranked.map((a, i) => (
          <div key={a.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl2 border border-navy/10 bg-white p-5 shadow-card">
            <div className="flex items-center gap-4">
              <span className="w-6 text-center font-display text-lg font-semibold text-navy">{i + 1}</span>
              <div>
                <Link href={`/reviewer/applications/${a.id}`} className="font-semibold text-navy hover:underline">
                  {a.businessName}
                </Link>
                <p className="text-xs text-slate">{a.recommendation.summary.slice(0, 90)}…</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-semibold text-navy">{a.finalScore}</span>
              <button
                onClick={() => toggle(a)}
                disabled={busyId === a.id}
                className={`rounded-full px-4 py-2 text-xs font-semibold transition disabled:opacity-40 ${
                  a.shortlisted ? "bg-forest-light text-forest" : "border border-navy/15 text-navy hover:border-navy"
                }`}
              >
                {a.shortlisted ? "✓ Shortlisted" : t.reviewer.addToShortlist}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
