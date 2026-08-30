"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import {
  fetchApplicantApplication,
  addMissingInfo,
  acceptDeclaration,
  submitApplication,
} from "@/lib/api";
import { Application } from "@/lib/types";
import { LoadingState, ErrorState } from "@/components/RequestState";
import StatusBadge from "@/components/StatusBadge";
import { ScoreBar, ScoreCircle, EligibilityPill } from "@/components/ScoreBits";

type Tab =
  | "overview"
  | "verification"
  | "missing"
  | "proposal"
  | "eligibility"
  | "score"
  | "declarations"
  | "review";

export default function ApplicantApplication() {
  const { t } = useLanguage();
  const params = useParams<{ id: string }>();
  const [app, setApp] = useState<Application | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [pendingFieldId, setPendingFieldId] = useState<string | null>(null);
  const [draftValue, setDraftValue] = useState("");
  const [busy, setBusy] = useState(false);

  function load() {
    setError(null);
    setApp(null);
    fetchApplicantApplication(params.id).then(setApp).catch(setError);
  }

  useEffect(load, [params.id]);

  if (error) return <ErrorState error={error} onRetry={load} />;
  if (!app) return <LoadingState />;

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: t.applicant.generatedApplication },
    { id: "verification", label: t.applicant.verification },
    { id: "missing", label: t.applicant.missingInfo },
    { id: "proposal", label: t.applicant.proposal },
    { id: "eligibility", label: t.applicant.eligibility },
    { id: "score", label: t.applicant.provisionalScore },
    { id: "declarations", label: t.applicant.declarations },
    { id: "review", label: t.applicant.finalReview },
  ];

  const allAccepted = app.declarations.every((d) => d.accepted);

  async function handleSaveMissing(fieldId: string) {
    if (!draftValue.trim()) return;
    setBusy(true);
    try {
      const updated = await addMissingInfo(app!.id, fieldId, draftValue.trim());
      setApp(updated);
      setPendingFieldId(null);
      setDraftValue("");
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  async function handleAcceptDeclaration(declarationId: string) {
    setBusy(true);
    try {
      const updated = await acceptDeclaration(app!.id, declarationId);
      setApp(updated);
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await submitApplication(app!.id);
      setSubmitted(true);
    } catch (err) {
      setError(err);
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-forest-light text-3xl text-forest">
          ✓
        </div>
        <h1 className="mt-6 font-display text-2xl font-semibold text-ink">
          {t.applicant.submittedTitle}
        </h1>
        <p className="mt-3 text-ink/60">{t.applicant.submittedBody}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">
            {app.businessName}
          </h1>
          <p className="text-sm text-ink/50">
            {app.owner} · {app.location} · {app.sector}
          </p>
        </div>
        <EligibilityPill status={app.eligibility.status} />
      </div>

      <nav
        className="mt-6 flex gap-1 overflow-x-auto border-b border-coffee/10 pb-px"
        aria-label="Application sections"
      >
        {tabs.map((tb) => (
          <button
            key={tb.id}
            onClick={() => setTab(tb.id)}
            className={`shrink-0 border-b-2 px-3 py-2.5 text-sm font-semibold transition ${
              tab === tb.id
                ? "border-gold text-coffee"
                : "border-transparent text-ink/40 hover:text-ink/70"
            }`}
          >
            {tb.label}
          </button>
        ))}
      </nav>

      <div className="py-6">
        {tab === "overview" && (
          <div className="flex flex-col gap-6">
            <InfoGrid
              title="Business Information"
              rows={[
                ["Business name", app.businessName],
                ["Owner", app.owner],
                ["Location", app.location],
                ["Sector", app.sector],
                ["Business type", app.businessType],
                // ["Years in operation", String(app.yearsOperating)],
              ]}
            />
            <InfoGrid
              title="Employment"
              rows={[
                ["Total employees", String(app.employment.total)],
                ["Female employees", String(app.employment.female)],
                ["Male employees", String(app.employment.male)],
                ["Youth employees", String(app.employment.youth)],
              ]}
            />
            <InfoGrid
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
                    : "Not provided",
                ],
                ["Revenue growth", app.financial.revenueGrowth],
                [
                  "Funding requested",
                  `ETB ${app.financial.fundingRequested.toLocaleString()}`,
                ],
              ]}
            />
            <InfoGrid
              title="Management"
              rows={[["Management", app.management]]}
            />
            <InfoGrid
              title="Equipment"
              rows={app.equipment.map((e) => [
                e.item,
                `${e.qty} · ETB ${e.estValueETB.toLocaleString()}`,
              ])}
            />
            <InfoGrid
              title="Funding Request"
              rows={[
                ["Amount", `ETB ${app.fundingRequest.amount.toLocaleString()}`],
                ["Purpose", app.fundingRequest.purpose],
                ["Expected use", app.fundingRequest.expectedUse],
              ]}
            />
          </div>
        )}

        {tab === "verification" && (
          <div className="flex flex-col gap-3">
            {app.evidence.map((f) => (
              <div
                key={f.label}
                className="rounded-xl2 border border-coffee/10 bg-paper p-5 shadow-card"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-ink">{f.label}</p>
                  <StatusBadge status={f.status} />
                </div>
                <p className="mt-1 text-lg text-ink">{f.value}</p>
                <p className="mt-2 trail-dot pl-3 text-xs font-medium uppercase tracking-wide text-ink/40">
                  {t.applicant.source}: {f.source}
                </p>
                {f.contradictionDetail && (
                  <div className="mt-3 rounded-lg bg-clay-light p-3 text-sm text-clay">
                    <p>
                      <span className="font-semibold">
                        {f.contradictionDetail.otherSource}:
                      </span>{" "}
                      {f.contradictionDetail.otherValue}
                    </p>
                    <p className="mt-1">{f.contradictionDetail.action}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === "missing" && (
          <div>
            <p className="mb-4 text-ink/60">
              {app.missing.length}{" "}
              {app.missing.length === 1 ? "thing is" : "things are"} still
              needed.
            </p>
            <div className="flex flex-col gap-3">
              {app.missing.length === 0 && (
                <p className="text-sm text-forest">No missing information. ✓</p>
              )}
              {app.missing.map((m) => (
                <div
                  key={m.id}
                  className="rounded-xl2 border border-coffee/10 bg-paper p-5 shadow-card"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-clay">⚠ {m.label}</p>
                      <p className="mt-1 text-xs text-ink/50">
                        {t.applicant.requiredFrom}: {m.requiredFrom}
                      </p>
                    </div>
                    {pendingFieldId !== m.id && (
                      <button
                        onClick={() => {
                          setPendingFieldId(m.id);
                          setDraftValue("");
                        }}
                        className="rounded-full border border-coffee/15 px-4 py-2 text-sm font-semibold text-coffee hover:border-gold"
                      >
                        {t.applicant.addInformation}
                      </button>
                    )}
                  </div>
                  {pendingFieldId === m.id && (
                    <div className="mt-3 flex gap-2">
                      <input
                        autoFocus
                        value={draftValue}
                        onChange={(e) => setDraftValue(e.target.value)}
                        placeholder={m.label}
                        className="flex-1 rounded-lg border border-coffee/15 px-3 py-2 text-sm"
                      />
                      <button
                        onClick={() => handleSaveMissing(m.id)}
                        disabled={busy || !draftValue.trim()}
                        className="rounded-lg bg-coffee px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
                      >
                        {t.common.save}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "proposal" && (
          <div className="rounded-xl2 border border-coffee/10 bg-paper p-6 shadow-card">
            <InfoGrid
              rows={[
                ["Project title", app.proposal.projectTitle],
                ["Location", app.proposal.location],
                ["Sector", app.proposal.sector],
                [
                  "Funding target",
                  `ETB ${app.proposal.fundingTargetETB.toLocaleString()}`,
                ],
                ["Beneficiaries", String(app.proposal.beneficiaries)],
                ["SDGs", app.proposal.sdgs.join(", ")],
              ]}
            />
            <p className="mt-5 text-sm font-semibold text-ink/50">Milestones</p>
            <ol className="mt-2 flex flex-col gap-2">
              {app.proposal.milestones.map((m, i) => (
                <li key={m} className="trail-dot pl-3 text-sm text-ink">
                  {i + 1}. {m}
                </li>
              ))}
            </ol>
          </div>
        )}

        {tab === "eligibility" && (
          <div className="rounded-xl2 border border-coffee/10 bg-paper p-6 shadow-card">
            <EligibilityPill status={app.eligibility.status} />
            <ul className="mt-5 flex flex-col gap-2">
              {app.eligibility.checks.map((c) => (
                <li
                  key={c.label}
                  className={`text-sm ${c.passed ? "text-ink" : "text-clay"}`}
                >
                  {c.passed ? "✓" : "✕"} {c.label}
                </li>
              ))}
            </ul>
            <p className="mt-5 text-sm font-semibold text-ink/50">
              Exclusion Factors
            </p>
            {app.eligibility.exclusionFactor ? (
              <div className="mt-2 rounded-lg bg-clay-light p-4">
                <p className="font-semibold text-clay">✕ EXCLUSION FACTOR</p>
                <p className="mt-1 text-sm text-ink">
                  {app.eligibility.exclusionFactor.reason}
                </p>
                <p className="mt-1 text-xs text-ink/50">
                  {t.applicant.source}:{" "}
                  {app.eligibility.exclusionFactor.evidence}
                </p>
              </div>
            ) : (
              <p className="mt-1 text-sm text-forest">
                ✓ {t.reviewer.noneDetected}
              </p>
            )}
          </div>
        )}

        {tab === "score" && (
          <div>
            <div className="flex items-center gap-5 rounded-xl2 border border-coffee/10 bg-paper p-6 shadow-card">
              <ScoreCircle score={app.finalScore} />
              <p className="text-sm text-ink/50">
                {t.applicant.provisionalNote}
              </p>
            </div>
            <div className="mt-4 flex flex-col gap-3">
              {app.scoring.map((c) => (
                <div
                  key={c.key}
                  className="rounded-xl2 border border-coffee/10 bg-paper p-5 shadow-card"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-ink">{c.label}</p>
                    <ScoreBar score={c.score} max={c.max} />
                  </div>
                  <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-ink/40">
                    {t.applicant.why}
                  </p>
                  <p className="mt-1 text-sm text-ink/80">{c.reason}</p>
                  <p className="mt-2 text-xs text-ink/40">
                    {t.applicant.source}: {c.evidence.join(", ")}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "declarations" && (
          <div className="flex flex-col gap-4">
            {app.declarations.map((d, i) => (
              <div
                key={d.id}
                className="rounded-xl2 border border-coffee/10 bg-paper p-6 shadow-card"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-ink/40">
                  {t.applicant.declarations} {i + 1} / {app.declarations.length}
                </p>
                <p className="mt-2 font-semibold text-ink">{d.title}</p>
                <p className="mt-1 text-sm text-ink/70">{d.text}</p>
                <button className="mt-3 text-sm font-semibold text-gold-dark hover:underline">
                  🔊 {t.applicant.explainIn}
                </button>
                <div className="mt-4 flex items-center gap-3">
                  <button
                    onClick={() => handleAcceptDeclaration(d.id)}
                    disabled={busy || d.accepted}
                    className={`rounded-full px-5 py-2 text-sm font-semibold transition disabled:cursor-default ${
                      d.accepted
                        ? "bg-forest-light text-forest"
                        : "bg-coffee text-white hover:bg-ink"
                    }`}
                  >
                    {d.accepted ? "✓ " : ""}
                    {t.applicant.iUnderstand}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "review" && (
          <div className="rounded-xl2 border border-coffee/10 bg-paper p-6 shadow-card">
            <InfoGrid
              rows={[
                ["Business", app.businessName],
                ["Eligibility", t.status[app.eligibility.status]],
                ["Score", `${app.finalScore} / 100`],
                ["Missing information", String(app.missing.length)],
                ["Contradictions", String(app.contradictions.length)],
                [
                  "Declarations",
                  `${app.declarations.filter((d) => d.accepted).length}/${app.declarations.length}`,
                ],
              ]}
            />
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                onClick={handleSubmit}
                disabled={!allAccepted || submitting}
                className="rounded-full bg-gold px-6 py-2.5 text-sm font-semibold text-coffee shadow-card transition hover:bg-gold-dark hover:text-white disabled:opacity-40"
              >
                {submitting
                  ? `${t.common.loading}…`
                  : t.applicant.submitApplication}
              </button>
            </div>
            {!allAccepted && (
              <p className="mt-3 text-xs text-clay">
                Accept all declarations before submitting.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function InfoGrid({
  title,
  rows,
}: {
  title?: string;
  rows: [string, string][];
}) {
  return (
    <div
      className={
        title
          ? "rounded-xl2 border border-coffee/10 bg-paper p-6 shadow-card"
          : ""
      }
    >
      {title && (
        <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-ink/40">
          {title}
        </p>
      )}
      <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
        {rows.map(([k, v]) => (
          <div key={k}>
            <dt className="text-xs text-ink/40">{k}</dt>
            <dd className="text-sm font-medium text-ink">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
