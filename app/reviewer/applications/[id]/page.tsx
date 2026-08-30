"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import {
  fetchReviewerApplication,
  saveReviewerDecision,
  setShortlisted,
  requestVerification,
} from "@/lib/api";
import { Application } from "@/lib/types";
import { LoadingState, ErrorState } from "@/components/RequestState";
import StatusBadge from "@/components/StatusBadge";
import { ScoreBar, ScoreCircle, EligibilityPill } from "@/components/ScoreBits";

type Tab =
  | "profile"
  | "evidence"
  | "eligibility"
  | "scoring"
  | "contradictions"
  | "missing"
  | "siteVisit"
  | "recommendation"
  | "decision";

const RECOMMENDATION_STYLES: Record<string, string> = {
  "Strongly Recommended": "bg-forest-light text-forest",
  Recommended: "bg-forest-light text-forest",
  "Needs Review": "bg-amber-light text-amber",
  "Not Recommended": "bg-clay-light text-clay",
  Ineligible: "bg-clay text-white",
};

const SEVERITY_BORDER: Record<string, string> = {
  High: "border-l-4 border-l-clay",
  Medium: "border-l-4 border-l-amber",
  Low: "border-l-4 border-l-forest",
};

type Toast = { id: number; kind: "success" | "error"; message: string };
type ScoreSort = "default" | "high" | "low";

export default function ReviewerApplicationDetail() {
  const { t } = useLanguage();
  const params = useParams<{ id: string }>();
  const [app, setApp] = useState<Application | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [tab, setTab] = useState<Tab>("profile");

  const [decision, setDecision] = useState<
    "approve" | "moreInfo" | "reject" | null
  >(null);
  const [notes, setNotes] = useState("");
  const [savedDecision, setSavedDecision] = useState<{
    choice: typeof decision;
    notes: string;
  }>({ choice: null, notes: "" });
  const [saving, setSaving] = useState(false);

  const [shortlistBusy, setShortlistBusy] = useState(false);
  const [verifyBusy, setVerifyBusy] = useState(false);
  const [verifySent, setVerifySent] = useState(false);

  const [visitedTabs, setVisitedTabs] = useState<Set<Tab>>(
    new Set(["profile"]),
  );
  const [evidenceFilter, setEvidenceFilter] = useState("");
  const [scoreSort, setScoreSort] = useState<ScoreSort>("default");
  const [expandedReasons, setExpandedReasons] = useState<Set<string>>(
    new Set(),
  );
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [copiedQuestions, setCopiedQuestions] = useState(false);

  const tabRefs = useRef<Partial<Record<Tab, HTMLButtonElement | null>>>({});
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  function pushToast(kind: Toast["kind"], message: string) {
    const id = Date.now() + Math.random();
    setToasts((ts) => [...ts, { id, kind, message }]);
    setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)), 3200);
  }

  function load() {
    setError(null);
    setApp(null);
    fetchReviewerApplication(params.id)
      .then((a) => {
        setApp(a);
        const choice = a.reviewerDecision?.choice ?? null;
        const savedNotes = a.reviewerDecision?.notes ?? "";
        setDecision(choice);
        setNotes(savedNotes);
        setSavedDecision({ choice, notes: savedNotes });
      })
      .catch(setError);
  }

  useEffect(load, [params.id]);

  const isDirty =
    decision !== savedDecision.choice || notes !== savedDecision.notes;

  // Warn on hard navigation / tab close if there's an unsaved decision.
  useEffect(() => {
    function beforeUnload(e: BeforeUnloadEvent) {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    }
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [isDirty]);

  // Slide the active-tab indicator under whichever tab button is current.
  useEffect(() => {
    const el = tabRefs.current[tab];
    if (el) setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
  }, [tab, app]);

  if (error) return <ErrorState error={error} onRetry={load} />;
  if (!app) return <LoadingState />;

  const tabs: { id: Tab; label: string; count?: number; alert?: boolean }[] = [
    { id: "profile", label: t.reviewer.profile },
    { id: "evidence", label: t.reviewer.evidence },
    {
      id: "eligibility",
      label: t.reviewer.eligibility,
      alert: !!app.eligibility.exclusionFactor,
    },
    { id: "scoring", label: t.reviewer.scoring },
    {
      id: "contradictions",
      label: t.reviewer.contradictions,
      count: app.contradictions.length,
      alert: app.contradictions.some((c) => c.severity === "High"),
    },
    { id: "missing", label: t.reviewer.missingInfo, count: app.missing.length },
    { id: "siteVisit", label: t.reviewer.siteVisit },
    { id: "recommendation", label: t.reviewer.recommendation },
    { id: "decision", label: t.reviewer.decision, alert: isDirty },
  ];

  function goToTab(next: Tab) {
    setTab(next);
    setVisitedTabs((v) => new Set(v).add(next));
  }

  function handleTabKeyDown(e: React.KeyboardEvent, idx: number) {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const dir = e.key === "ArrowRight" ? 1 : -1;
      const next = tabs[(idx + dir + tabs.length) % tabs.length];
      goToTab(next.id);
      tabRefs.current[next.id]?.focus();
    }
  }

  function toggleReason(key: string) {
    setExpandedReasons((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  async function handleSaveDecision() {
    if (!decision) return;
    setSaving(true);
    try {
      const updated = await saveReviewerDecision(app!.id, decision, notes);
      setApp(updated);
      setSavedDecision({ choice: decision, notes });
      pushToast("success", `${t.reviewer.saveDecision} saved`);
    } catch (err) {
      setError(err);
      pushToast("error", "Couldn't save the decision — try again");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleShortlist() {
    setShortlistBusy(true);
    try {
      const updated = await setShortlisted(app!.id, !app!.shortlisted);
      setApp(updated);
      pushToast(
        "success",
        updated.shortlisted ? "Added to shortlist" : "Removed from shortlist",
      );
    } catch (err) {
      setError(err);
      pushToast("error", "Couldn't update the shortlist");
    } finally {
      setShortlistBusy(false);
    }
  }

  async function handleRequestVerification() {
    setVerifyBusy(true);
    try {
      await requestVerification(app!.id);
      setVerifySent(true);
      pushToast("success", "Verification requested");
    } catch (err) {
      setError(err);
      pushToast("error", "Couldn't request verification");
    } finally {
      setVerifyBusy(false);
    }
  }

  async function handleCopyQuestions() {
    const text = app!.siteVisitQuestions
      .map((q, i) => `${i + 1}. ${q}`)
      .join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopiedQuestions(true);
      setTimeout(() => setCopiedQuestions(false), 1800);
    } catch {
      pushToast("error", "Couldn't copy to clipboard");
    }
  }

  const filteredEvidence = app.evidence.filter((f) => {
    const q = evidenceFilter.trim().toLowerCase();
    return (
      q === "" ||
      f.label.toLowerCase().includes(q) ||
      f.value.toLowerCase().includes(q) ||
      f.source.toLowerCase().includes(q)
    );
  });

  const sortedScoring = [...app.scoring].sort((a, b) => {
    if (scoreSort === "high") return b.score / b.max - a.score / a.max;
    if (scoreSort === "low") return a.score / a.max - b.score / b.max;
    return 0;
  });

  const reviewProgress = Math.round((visitedTabs.size / tabs.length) * 100);

  return (
    <div className="relative pb-10">
      {/* Toasts */}
      <div className="pointer-events-none fixed right-4 top-4 z-50 flex flex-col items-end gap-2">
        {toasts.map((tst) => (
          <div
            key={tst.id}
            className={`toast-in pointer-events-auto rounded-lg px-4 py-2.5 text-sm font-medium text-white shadow-card ${
              tst.kind === "success" ? "bg-forest" : "bg-clay"
            }`}
          >
            {tst.message}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-navy">
            {app.businessName}
          </h1>
          {/* <p className="mt-1 text-sm text-slate">
            {app.owner} · {app.location} · {app.sector} · {app.yearsOperating}{" "}
            yrs operating
          </p> */}
          <div className="mt-3 flex items-center gap-2">
            <div className="h-1.5 w-32 overflow-hidden rounded-full bg-navy/10">
              <div
                className="h-full rounded-full bg-navy transition-all duration-500 ease-out"
                style={{ width: `${reviewProgress}%` }}
              />
            </div>
            <span className="text-xs font-medium text-slate">
              {reviewProgress}% reviewed
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ScoreCircle score={app.finalScore} />
          <EligibilityPill status={app.eligibility.status} />
        </div>
      </div>

      <nav
        role="tablist"
        aria-label="Application sections"
        className="sticky top-0 z-20 mt-6 -mx-1 flex gap-1 overflow-x-auto border-b border-navy/10 bg-white/90 px-1 pb-px backdrop-blur"
      >
        {tabs.map((tb, idx) => (
          <button
            key={tb.id}
            ref={(el) => {
              tabRefs.current[tb.id] = el;
            }}
            role="tab"
            aria-selected={tab === tb.id}
            tabIndex={tab === tb.id ? 0 : -1}
            onClick={() => goToTab(tb.id)}
            onKeyDown={(e) => handleTabKeyDown(e, idx)}
            className={`relative flex shrink-0 items-center gap-1.5 px-3 py-2.5 text-sm font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-navy/40 ${
              tab === tb.id ? "text-navy" : "text-slate hover:text-navy"
            }`}
          >
            {tb.label}
            {typeof tb.count === "number" && tb.count > 0 && (
              <span
                className={`rounded-full bg-clay px-1.5 py-0.5 text-[10px] font-bold text-white ${tb.alert ? "pulse-soft" : ""}`}
              >
                {tb.count}
              </span>
            )}
            {tb.alert && !tb.count && (
              <span
                className="h-1.5 w-1.5 rounded-full bg-clay pulse-soft"
                aria-hidden
              />
            )}
          </button>
        ))}
        <span
          className="pointer-events-none absolute bottom-0 h-0.5 rounded-full bg-navy transition-all duration-300 ease-out"
          style={{ left: indicator.left, width: indicator.width }}
        />
      </nav>

      <div key={tab} className="tab-fade py-6">
        {tab === "profile" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Panel
              title="Business Profile"
              rows={[
                ["Business name", app.businessName],
                ["Owner", app.owner],
                ["Location", app.location],
                ["Sector", app.sector],
                ["Business type", app.businessType],
                // ["Years operating", String(app.yearsOperating)],
                ["Employees", String(app.employment.total)],
                [
                  "Funding request",
                  `ETB ${app.fundingRequest.amount.toLocaleString()}`,
                ],
              ]}
            />
            <Panel
              title="Financial Information"
              rows={[
                [
                  "2023 sales",
                  `ETB ${app.financial.annualSales2023.toLocaleString()}`,
                ],
                [
                  "2024 sales",
                  app.financial.annualSales2024
                    ? `ETB ${app.financial.annualSales2024.toLocaleString()}`
                    : "Not established",
                ],
                ["Revenue growth", app.financial.revenueGrowth],
                ["Purpose", app.fundingRequest.purpose],
              ]}
            />
          </div>
        )}

        {tab === "evidence" && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <div className="relative w-full max-w-xs">
                <input
                  value={evidenceFilter}
                  onChange={(e) => setEvidenceFilter(e.target.value)}
                  placeholder="Filter evidence…"
                  className="w-full rounded-full border border-navy/15 bg-white px-4 py-2 text-sm text-navy placeholder:text-slate focus:border-navy focus:outline-none"
                />
                {evidenceFilter && (
                  <button
                    onClick={() => setEvidenceFilter("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate hover:text-navy"
                    aria-label="Clear filter"
                  >
                    ✕
                  </button>
                )}
              </div>
              <span className="shrink-0 text-xs font-medium text-slate">
                {filteredEvidence.length} of {app.evidence.length}
              </span>
            </div>

            {filteredEvidence.length === 0 && (
              <div className="rounded-xl2 border border-dashed border-navy/15 bg-white p-8 text-center text-sm text-slate">
                No evidence matches “{evidenceFilter}”.
              </div>
            )}

            {filteredEvidence.map((f) => (
              <div
                key={f.label}
                className="rounded-xl2 border border-navy/10 bg-white p-5 shadow-card transition-shadow hover:shadow-md"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-navy">{f.label}</p>
                  <StatusBadge status={f.status} />
                </div>
                <p className="mt-1 text-lg text-navy">{f.value}</p>
                <p className="mt-2 trail-dot pl-3 text-xs font-medium uppercase tracking-wide text-slate">
                  Source: {f.source}
                </p>
              </div>
            ))}
          </div>
        )}

        {tab === "eligibility" && (
          <div className="rounded-xl2 border border-navy/10 bg-white p-6 shadow-card">
            <EligibilityPill status={app.eligibility.status} />
            <ul className="mt-5 flex flex-col gap-2">
              {app.eligibility.checks.map((c) => (
                <li
                  key={c.label}
                  className={`flex items-center gap-2 text-sm ${c.passed ? "text-navy" : "text-clay"}`}
                >
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${
                      c.passed ? "bg-forest" : "bg-clay"
                    }`}
                  >
                    {c.passed ? "✓" : "✕"}
                  </span>
                  {c.label}
                </li>
              ))}
            </ul>
            <p className="mt-5 text-sm font-semibold text-slate">
              {t.reviewer.exclusionFactors}
            </p>
            {app.eligibility.exclusionFactor ? (
              <div className="mt-2 rounded-lg bg-clay-light p-4">
                <p className="font-semibold text-clay">✕ EXCLUSION FACTOR</p>
                <p className="mt-1 text-sm text-navy">
                  Reason: {app.eligibility.exclusionFactor.reason}
                </p>
                <p className="mt-1 text-xs text-slate">
                  Evidence: {app.eligibility.exclusionFactor.evidence}
                </p>
              </div>
            ) : (
              <p className="mt-1 text-sm text-forest">
                ✓ {t.reviewer.noneDetected}
              </p>
            )}
          </div>
        )}

        {tab === "scoring" && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-end gap-1.5">
              {(
                [
                  ["default", "Original order"],
                  ["high", "Highest first"],
                  ["low", "Lowest first"],
                ] as [ScoreSort, string][]
              ).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setScoreSort(key)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    scoreSort === key
                      ? "bg-navy text-white"
                      : "border border-navy/15 text-slate hover:text-navy"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {sortedScoring.map((c) => {
              const isExpanded = expandedReasons.has(c.key);
              const isLong = c.reason.length > 160;
              return (
                <div
                  key={c.key}
                  className="rounded-xl2 border border-navy/10 bg-white p-5 shadow-card"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-semibold text-navy">{c.label}</p>
                    <ScoreBar score={c.score} max={c.max} />
                  </div>
                  <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate">
                    Reason
                  </p>
                  <p className="mt-1 text-sm text-navy/80">
                    {isLong && !isExpanded
                      ? `${c.reason.slice(0, 160)}…`
                      : c.reason}
                  </p>
                  {isLong && (
                    <button
                      onClick={() => toggleReason(c.key)}
                      className="mt-1 text-xs font-semibold text-navy underline-offset-2 hover:underline"
                    >
                      {isExpanded ? "Show less" : "Show more"}
                    </button>
                  )}
                  <p className="mt-2 text-xs text-slate">
                    Evidence: {c.evidence.join(", ")}
                  </p>
                </div>
              );
            })}
            <div className="mt-2 flex items-center justify-between rounded-xl2 border-2 border-navy bg-navy-soft p-5">
              <span className="font-display text-lg font-semibold text-navy">
                Final Score
              </span>
              <span className="font-display text-2xl font-semibold text-navy">
                {app.finalScore} / 100
              </span>
            </div>
          </div>
        )}

        {tab === "contradictions" && (
          <div className="flex flex-col gap-3">
            {app.contradictions.length === 0 && (
              <p className="text-sm text-forest">✓ {t.reviewer.noneDetected}</p>
            )}
            {app.contradictions.map((c, i) => (
              <div
                key={c.id}
                className={`rounded-xl2 bg-white p-5 shadow-card ${SEVERITY_BORDER[c.severity] ?? "border border-navy/10"}`}
              >
                <p className="flex items-center gap-2 font-semibold text-clay">
                  {c.severity === "High" && (
                    <span
                      className="h-1.5 w-1.5 rounded-full bg-clay pulse-soft"
                      aria-hidden
                    />
                  )}
                  ⚠ Issue {i + 1}: {c.title}
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <div className="rounded-lg bg-navy-soft p-3 text-sm">
                    <p className="text-xs font-semibold uppercase text-slate">
                      {c.fieldA.label}
                    </p>
                    <p className="text-navy">{c.fieldA.value}</p>
                  </div>
                  <div className="rounded-lg bg-navy-soft p-3 text-sm">
                    <p className="text-xs font-semibold uppercase text-slate">
                      {c.fieldB.label}
                    </p>
                    <p className="text-navy">{c.fieldB.value}</p>
                  </div>
                </div>
                <p className="mt-3 text-xs font-semibold uppercase text-slate">
                  Severity:{" "}
                  <span
                    className={
                      c.severity === "High"
                        ? "text-clay"
                        : c.severity === "Medium"
                          ? "text-amber"
                          : "text-forest"
                    }
                  >
                    {c.severity}
                  </span>
                </p>
                <p className="mt-1 text-sm text-navy">
                  Recommended Action: {c.recommendedAction}
                </p>
              </div>
            ))}
          </div>
        )}

        {tab === "missing" && (
          <div className="flex flex-col gap-3">
            {app.missing.length === 0 && (
              <p className="text-sm text-forest">✓ {t.reviewer.noneDetected}</p>
            )}
            {app.missing.map((m) => (
              <div
                key={m.id}
                className="rounded-xl2 border-l-4 border-l-amber border-navy/10 bg-white p-5 shadow-card"
              >
                <p className="font-semibold text-clay">⚠ {m.label}</p>
                <p className="mt-1 text-xs text-slate">
                  Source needed: {m.requiredFrom}
                </p>
              </div>
            ))}
          </div>
        )}

        {tab === "siteVisit" && (
          <div className="rounded-xl2 border border-navy/10 bg-white p-6 shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate">
                {app.siteVisitQuestions.length} questions
              </p>
              <button
                onClick={handleCopyQuestions}
                className="rounded-full border border-navy/15 px-3 py-1.5 text-xs font-semibold text-navy hover:border-navy"
              >
                {copiedQuestions ? "✓ Copied" : "Copy all"}
              </button>
            </div>
            <ol className="flex flex-col gap-3">
              {app.siteVisitQuestions.map((q, i) => (
                <li key={q} className="trail-dot pl-3 text-sm text-navy">
                  {i + 1}. {q}
                </li>
              ))}
            </ol>
          </div>
        )}

        {tab === "recommendation" && (
          <div className="rounded-xl2 border border-navy/10 bg-white p-6 shadow-card">
            <span
              className={`inline-block rounded-full px-4 py-1.5 text-sm font-bold ${RECOMMENDATION_STYLES[app.recommendation.status]}`}
            >
              {app.recommendation.status}
            </span>
            <p className="mt-4 text-sm leading-relaxed text-navy/80">
              {app.recommendation.summary}
            </p>
          </div>
        )}

        {tab === "decision" && (
          <div className="rounded-xl2 border border-navy/10 bg-white p-6 shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate">
                {t.reviewer.decision}
              </p>
              {isDirty && (
                <span className="rounded-full bg-amber-light px-2.5 py-1 text-[11px] font-semibold text-amber">
                  Unsaved changes
                </span>
              )}
            </div>
            <div className="flex flex-col gap-2">
              {(
                [
                  ["approve", t.reviewer.approve],
                  ["moreInfo", t.reviewer.requestMore],
                  ["reject", t.reviewer.reject],
                ] as const
              ).map(([key, label]) => (
                <label
                  key={key}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition ${
                    decision === key
                      ? "border-navy bg-navy-soft"
                      : "border-navy/10 hover:bg-navy-soft"
                  }`}
                >
                  <input
                    type="radio"
                    name="decision"
                    checked={decision === key}
                    onChange={() => setDecision(key)}
                    className="h-4 w-4 accent-navy"
                  />
                  <span className="text-sm font-medium text-navy">{label}</span>
                </label>
              ))}
            </div>

            <div className="mt-5 flex items-center justify-between">
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate">
                {t.reviewer.reviewerNotes}
              </label>
              <span className="text-[11px] text-slate">
                {notes.length} chars
              </span>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="mt-2 w-full rounded-lg border border-navy/15 p-3 text-sm text-navy transition focus:border-navy focus:outline-none"
            />

            <div className="sticky bottom-4 mt-5 flex flex-wrap items-center gap-3 rounded-xl2 bg-white/95 py-2 backdrop-blur">
              <button
                onClick={handleSaveDecision}
                disabled={!decision || saving || !isDirty}
                className="rounded-full bg-navy px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-light disabled:opacity-40"
              >
                {saving ? `${t.common.loading}…` : t.reviewer.saveDecision}
              </button>
              <button
                onClick={handleToggleShortlist}
                disabled={shortlistBusy}
                className="rounded-full border border-navy/15 px-5 py-2.5 text-sm font-semibold text-navy transition hover:border-navy disabled:opacity-40"
              >
                {shortlistBusy
                  ? `${t.common.loading}…`
                  : app.shortlisted
                    ? "✓ Shortlisted"
                    : t.reviewer.addToShortlist}
              </button>
              <button
                onClick={handleRequestVerification}
                disabled={verifyBusy || verifySent}
                className="rounded-full border border-navy/15 px-5 py-2.5 text-sm font-semibold text-navy transition hover:border-navy disabled:opacity-40"
              >
                {verifyBusy
                  ? `${t.common.loading}…`
                  : verifySent
                    ? "✓ Requested"
                    : t.reviewer.requestVerification}
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .tab-fade {
          animation: fadeIn 0.22s ease-out;
        }
        @keyframes toastIn {
          from {
            opacity: 0;
            transform: translateX(12px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .toast-in {
          animation: toastIn 0.2s ease-out;
        }
        @keyframes pulseSoft {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.45;
          }
        }
        .pulse-soft {
          animation: pulseSoft 1.6s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .tab-fade,
          .toast-in,
          .pulse-soft {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}

function Panel({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <div className="rounded-xl2 border border-navy/10 bg-white p-6 shadow-card">
      <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate">
        {title}
      </p>
      <dl className="grid grid-cols-1 gap-x-6 gap-y-3">
        {rows.map(([k, v]) => (
          <div
            key={k}
            className="flex items-center justify-between gap-4 rounded-md border-b border-navy/5 px-1 pb-2 transition-colors last:border-0 hover:bg-navy-soft"
          >
            <dt className="text-xs text-slate">{k}</dt>
            <dd className="text-right text-sm font-medium text-navy">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
