"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { submitGeneratedApplication } from "@/lib/api";

type GeneratedApplication = {
  project_name: string;
  tagline: string;
  problem: string;
  funding_use: string;
  project_description: string;
  sector: string;
  location: string;
  sdg_categories: string[];
  funding_target: number | null;
  currency: string;
  number_of_beneficiaries: number | null;
  beneficiaries: string[];
  implementing_organisation: string;

  milestones: string[];

  business_license_verified: boolean;
  business_license_business_name: string;
  business_license_owner_name: string;
  business_license_number: string;
  business_license_business_type: string;
  business_license_location: string;

  workshop_photo_is_business_related: boolean;
  workshop_photo_is_workshop: boolean;
  workshop_photo_supports_business_activity: boolean;
  workshop_photo_observations: string[];
};

type MissingItem = {
  id: string;
  label: string;
  requiredFrom: string;
  value?: string;
};

type Declaration = {
  id: string;
  title: string;
  text: string;
  accepted: boolean;
};

type Tab =
  | "overview"
  | "verification"
  | "missing"
  | "proposal"
  | "eligibility"
  | "score"
  | "declarations"
  | "review";

export default function ApplicantGeneratedApplication() {
  const { t } = useLanguage();
  const router = useRouter();

  const [app, setApp] = useState<GeneratedApplication | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [tab, setTab] = useState<Tab>("overview");

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [pendingFieldId, setPendingFieldId] = useState<string | null>(null);

  const [draftValue, setDraftValue] = useState("");
  const [busy, setBusy] = useState(false);

  /*
   * These are UI-level values because the new AI response
   * does not currently return missing/declarations/scoring.
   */
  const [missing, setMissing] = useState<MissingItem[]>([]);
  const [declarations, setDeclarations] = useState<Declaration[]>([
    {
      id: "accuracy",
      title: "Accuracy of Information",
      text: "I confirm that the information provided in this application is accurate and represents my business and project to the best of my knowledge.",
      accepted: false,
    },
    {
      id: "funding",
      title: "Use of Funding",
      text: "I understand that any funding received should be used for the purpose described in this application.",
      accepted: false,
    },
    {
      id: "verification",
      title: "Verification",
      text: "I understand that the information and documents provided may be verified during the review process.",
      accepted: false,
    },
  ]);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("generatedApplication");

      if (!stored) {
        setError("No generated application was found.");
        return;
      }

      const parsed: GeneratedApplication = JSON.parse(stored);

      setApp(parsed);

      /*
       * Build missing information from the actual AI response.
       * Only fields that are actually missing are displayed.
       */
      const missingItems: MissingItem[] = [];

      if (!parsed.project_name?.trim()) {
        missingItems.push({
          id: "project_name",
          label: "Project name",
          requiredFrom: "Applicant",
        });
      }

      if (!parsed.project_description?.trim()) {
        missingItems.push({
          id: "project_description",
          label: "Project description",
          requiredFrom: "Applicant",
        });
      }

      if (
        parsed.funding_target === null ||
        parsed.funding_target === undefined
      ) {
        missingItems.push({
          id: "funding_target",
          label: "Funding target",
          requiredFrom: "Applicant",
        });
      }

      if (
        parsed.number_of_beneficiaries === null ||
        parsed.number_of_beneficiaries === undefined
      ) {
        missingItems.push({
          id: "number_of_beneficiaries",
          label: "Number of beneficiaries",
          requiredFrom: "Applicant",
        });
      }

      setMissing(missingItems);
    } catch {
      setError("Unable to load the generated application.");
    }
  }, []);

  if (error) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-clay-light text-2xl text-clay">
          !
        </div>

        <h1 className="mt-6 font-display text-2xl font-semibold text-ink">
          Application not found
        </h1>

        <p className="mt-3 text-sm text-ink/60">{error}</p>

        <button
          onClick={() => router.push("/applicant")}
          className="mt-6 rounded-full bg-coffee px-6 py-2.5 text-sm font-semibold text-white"
        >
          Back to Applicant Portal
        </button>
      </div>
    );
  }

  if (!app) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-sm text-ink/50">Loading generated application...</p>
      </div>
    );
  }

  /*
   * Submit success
   */
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

        <button
          onClick={() => router.push("/applicant")}
          className="mt-6 rounded-full bg-coffee px-6 py-2.5 text-sm font-semibold text-white"
        >
          Back to Applicant Portal
        </button>
      </div>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    {
      id: "overview",
      label: t.applicant.generatedApplication,
    },
    {
      id: "verification",
      label: t.applicant.verification,
    },
    {
      id: "missing",
      label: t.applicant.missingInfo,
    },
    {
      id: "proposal",
      label: t.applicant.proposal,
    },
    {
      id: "eligibility",
      label: t.applicant.eligibility,
    },
    {
      id: "score",
      label: t.applicant.provisionalScore,
    },
    {
      id: "declarations",
      label: t.applicant.declarations,
    },
    {
      id: "review",
      label: t.applicant.finalReview,
    },
  ];

  const allAccepted = declarations.every((d) => d.accepted);

  /*
   * Calculate a simple provisional score from the
   * information actually returned by the AI.
   */
  const scoreItems = [
    {
      key: "license",
      label: "Business License Verification",
      score: app.business_license_verified ? 20 : 0,
      max: 20,
      reason: app.business_license_verified
        ? "Business license was successfully verified."
        : "Business license could not be verified.",
      evidence: [app.business_license_number || "No license number"],
    },
    {
      key: "business",
      label: "Business Evidence",
      score: app.workshop_photo_is_business_related ? 20 : 0,
      max: 20,
      reason: app.workshop_photo_is_business_related
        ? "The uploaded photo is related to the business."
        : "The uploaded photo does not clearly relate to the business.",
      evidence: app.workshop_photo_observations,
    },
    {
      key: "activity",
      label: "Business Activity",
      score: app.workshop_photo_supports_business_activity ? 20 : 0,
      max: 20,
      reason: app.workshop_photo_supports_business_activity
        ? "The photo supports the stated business activity."
        : "The photo does not sufficiently support the stated business activity.",
      evidence: [app.business_license_business_type],
    },
    {
      key: "proposal",
      label: "Project Proposal",
      score:
        app.project_description && app.problem && app.funding_use ? 20 : 10,
      max: 20,
      reason:
        app.project_description && app.problem && app.funding_use
          ? "The application contains the core proposal information."
          : "Some proposal information is incomplete.",
      evidence: [
        app.project_name || "Project name not provided",
        app.project_description
          ? "Project description provided"
          : "Project description missing",
      ],
    },
    {
      key: "beneficiaries",
      label: "Beneficiary Information",
      score:
        app.number_of_beneficiaries !== null || app.beneficiaries.length > 0
          ? 20
          : 0,
      max: 20,
      reason:
        app.number_of_beneficiaries !== null || app.beneficiaries.length > 0
          ? "Beneficiary information was identified."
          : "Beneficiary information is missing.",
      evidence: app.beneficiaries,
    },
  ];

  const finalScore = scoreItems.reduce((total, item) => total + item.score, 0);

  const eligibilityChecks = [
    {
      label: "Business license verified",
      passed: app.business_license_verified,
    },
    {
      label: "Business name identified",
      passed: Boolean(app.business_license_business_name),
    },
    {
      label: "Business owner identified",
      passed: Boolean(app.business_license_owner_name),
    },
    {
      label: "Business location identified",
      passed: Boolean(app.location),
    },
    {
      label: "Business activity supported by photo",
      passed: app.workshop_photo_supports_business_activity,
    },
  ];

  const isEligible = eligibilityChecks.every((check) => check.passed);

  /*
   * Missing information
   */
  function handleSaveMissing(fieldId: string) {
    if (!draftValue.trim()) return;

    setBusy(true);

    const updatedMissing = missing.map((item) =>
      item.id === fieldId
        ? {
            ...item,
            value: draftValue.trim(),
          }
        : item,
    );

    setMissing(updatedMissing);

    setPendingFieldId(null);
    setDraftValue("");
    setBusy(false);
  }

  /*
   * Declaration acceptance
   */
  function handleAcceptDeclaration(declarationId: string) {
    setBusy(true);

    setDeclarations((current) =>
      current.map((declaration) =>
        declaration.id === declarationId
          ? {
              ...declaration,
              accepted: true,
            }
          : declaration,
      ),
    );

    setBusy(false);
  }

  /*
   * Submit
   */
  // async function handleSubmit() {
  //   if (!allAccepted) return;

  //   setSubmitting(true);

  //   try {
  //     /*
  //      * Keep the generated application in sessionStorage
  //      * and mark it as submitted.
  //      *
  //      * Replace this section later with your real
  //      * submitApplication API call.
  //      */
  //     sessionStorage.setItem("generatedApplicationSubmitted", "true");

  //     setSubmitted(true);
  //   } catch (err) {
  //     console.error(err);
  //   } finally {
  //     setSubmitting(false);
  //   }
  // }
  async function handleSubmit() {
    setSubmitting(true);
    setError(null);

    try {
      const stored = sessionStorage.getItem("generatedApplication");

      if (!stored) {
        throw new Error("Generated application not found.");
      }

      const generatedApplication: any = JSON.parse(stored);

      console.log("Submitting generated application:", generatedApplication);

      const submittedApplication =
        await submitGeneratedApplication(generatedApplication);

      console.log("Generated application submitted:", submittedApplication);

      // Keep the API response if you need it
      sessionStorage.setItem(
        "submittedApplication",
        JSON.stringify(submittedApplication),
      );

      sessionStorage.removeItem("generatedApplicationSubmitted");

      setSubmitted(true);
    } catch (err) {
      console.error("Submit failed:", err);
      // setError(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      {/* HEADER */}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">
            {app.business_license_business_name ||
              app.implementing_organisation}
          </h1>

          <p className="text-sm text-ink/50">
            {app.business_license_owner_name} · {app.location} · {app.sector}
          </p>
        </div>

        <EligibilityPill eligible={isEligible} />
      </div>

      {/* TABS */}

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
        {/* ================================================= */}
        {/* OVERVIEW */}
        {/* ================================================= */}

        {tab === "overview" && (
          <div className="flex flex-col gap-6">
            <InfoGrid
              title="Business Information"
              rows={[
                ["Business name", app.business_license_business_name],
                ["Owner", app.business_license_owner_name],
                ["Location", app.location],
                ["Sector", app.sector],
                ["Business type", app.business_license_business_type],
                ["License number", app.business_license_number],
              ]}
            />

            <InfoGrid
              title="Project Information"
              rows={[
                ["Project name", app.project_name || "Not provided"],
                ["Tagline", app.tagline || "Not provided"],
                ["Implementing organisation", app.implementing_organisation],
                ["Sector", app.sector],
                ["Location", app.location],
              ]}
            />

            <TextCard title="Problem" text={app.problem} />

            <TextCard
              title="Project Description"
              text={app.project_description}
            />

            <InfoGrid
              title="Funding Request"
              rows={[
                [
                  "Amount",
                  app.funding_target !== null
                    ? `${app.currency || "ETB"} ${app.funding_target.toLocaleString()}`
                    : "Not provided",
                ],
                ["Purpose", app.funding_use || "Not provided"],
              ]}
            />

            <InfoGrid
              title="Beneficiaries"
              rows={[
                [
                  "Number",
                  app.number_of_beneficiaries !== null
                    ? String(app.number_of_beneficiaries)
                    : "Not provided",
                ],
                [
                  "Groups",
                  app.beneficiaries.length
                    ? app.beneficiaries.join(", ")
                    : "Not provided",
                ],
              ]}
            />
          </div>
        )}

        {/* ================================================= */}
        {/* VERIFICATION */}
        {/* ================================================= */}

        {tab === "verification" && (
          <div className="flex flex-col gap-3">
            <VerificationCard
              label="Business License"
              verified={app.business_license_verified}
              value={
                app.business_license_verified
                  ? "Business license verified"
                  : "Business license not verified"
              }
            />

            <VerificationCard
              label="Business Name"
              verified={Boolean(app.business_license_business_name)}
              value={app.business_license_business_name}
            />

            <VerificationCard
              label="Owner Name"
              verified={Boolean(app.business_license_owner_name)}
              value={app.business_license_owner_name}
            />

            <VerificationCard
              label="License Number"
              verified={Boolean(app.business_license_number)}
              value={app.business_license_number}
            />

            <VerificationCard
              label="Business Location"
              verified={Boolean(app.business_license_location)}
              value={app.business_license_location}
            />

            <VerificationCard
              label="Business Activity"
              verified={app.workshop_photo_supports_business_activity}
              value={
                app.workshop_photo_supports_business_activity
                  ? "Photo supports business activity"
                  : "Photo does not clearly support activity"
              }
            />
          </div>
        )}

        {/* ================================================= */}
        {/* MISSING INFORMATION */}
        {/* ================================================= */}

        {tab === "missing" && (
          <div>
            <p className="mb-4 text-ink/60">
              {missing.filter((m) => !m.value).length}{" "}
              {missing.filter((m) => !m.value).length === 1
                ? "thing is"
                : "things are"}{" "}
              still needed.
            </p>

            <div className="flex flex-col gap-3">
              {missing.length === 0 && (
                <div className="rounded-xl2 border border-coffee/10 bg-paper p-6 shadow-card">
                  <p className="text-sm text-forest">
                    ✓ No missing information.
                  </p>

                  <p className="mt-2 text-sm text-ink/50">
                    The AI was able to generate all required information from
                    the provided documents.
                  </p>
                </div>
              )}

              {missing.map((m) => (
                <div
                  key={m.id}
                  className="rounded-xl2 border border-coffee/10 bg-paper p-5 shadow-card"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p
                        className={`font-semibold ${
                          m.value ? "text-forest" : "text-clay"
                        }`}
                      >
                        {m.value ? "✓" : "⚠"} {m.label}
                      </p>

                      <p className="mt-1 text-xs text-ink/50">
                        Required from: {m.requiredFrom}
                      </p>

                      {m.value && (
                        <p className="mt-2 text-sm text-ink">{m.value}</p>
                      )}
                    </div>

                    {!m.value && pendingFieldId !== m.id && (
                      <button
                        onClick={() => {
                          setPendingFieldId(m.id);
                          setDraftValue("");
                        }}
                        className="rounded-full border border-coffee/15 px-4 py-2 text-sm font-semibold text-coffee hover:border-gold"
                      >
                        Add Information
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
                        Save
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================================================= */}
        {/* PROPOSAL */}
        {/* ================================================= */}

        {tab === "proposal" && (
          <div className="rounded-xl2 border border-coffee/10 bg-paper p-6 shadow-card">
            <InfoGrid
              rows={[
                ["Project title", app.project_name || "Not provided"],
                ["Tagline", app.tagline || "Not provided"],
                ["Location", app.location],
                ["Sector", app.sector],
                [
                  "Funding target",
                  app.funding_target !== null
                    ? `${app.currency || "ETB"} ${app.funding_target.toLocaleString()}`
                    : "Not provided",
                ],
                [
                  "Beneficiaries",
                  app.number_of_beneficiaries !== null
                    ? String(app.number_of_beneficiaries)
                    : "Not provided",
                ],
                [
                  "SDGs",
                  app.sdg_categories.length
                    ? app.sdg_categories.join(", ")
                    : "Not provided",
                ],
              ]}
            />

            <div className="mt-6">
              <p className="text-sm font-semibold uppercase tracking-wide text-ink/40">
                Problem
              </p>

              <p className="mt-2 text-sm leading-6 text-ink/80">
                {app.problem || "Not provided"}
              </p>
            </div>

            <div className="mt-6">
              <p className="text-sm font-semibold uppercase tracking-wide text-ink/40">
                Project Description
              </p>

              <p className="mt-2 text-sm leading-6 text-ink/80">
                {app.project_description || "Not provided"}
              </p>
            </div>

            <div className="mt-6">
              <p className="text-sm font-semibold uppercase tracking-wide text-ink/40">
                Funding Use
              </p>

              <p className="mt-2 text-sm leading-6 text-ink/80">
                {app.funding_use || "Not provided"}
              </p>
            </div>

            <p className="mt-6 text-sm font-semibold text-ink/50">Milestones</p>

            {app.milestones.length > 0 ? (
              <ol className="mt-2 flex flex-col gap-2">
                {app.milestones.map((milestone, index) => (
                  <li key={index} className="trail-dot pl-3 text-sm text-ink">
                    {index + 1}. {milestone}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-2 text-sm text-ink/50">
                No milestones provided.
              </p>
            )}
          </div>
        )}

        {/* ================================================= */}
        {/* ELIGIBILITY */}
        {/* ================================================= */}

        {tab === "eligibility" && (
          <div className="rounded-xl2 border border-coffee/10 bg-paper p-6 shadow-card">
            <EligibilityPill eligible={isEligible} />

            <ul className="mt-5 flex flex-col gap-2">
              {eligibilityChecks.map((check) => (
                <li
                  key={check.label}
                  className={`text-sm ${
                    check.passed ? "text-ink" : "text-clay"
                  }`}
                >
                  {check.passed ? "✓" : "✕"} {check.label}
                </li>
              ))}
            </ul>

            <p className="mt-5 text-sm font-semibold text-ink/50">
              Exclusion / Review Factors
            </p>

            {!app.workshop_photo_is_workshop && (
              <div className="mt-2 rounded-lg bg-clay-light p-4">
                <p className="font-semibold text-clay">⚠ PHOTO REVIEW</p>

                <p className="mt-1 text-sm text-ink">
                  The image appears to show a business setting, but it does not
                  clearly demonstrate a workshop or support the stated business
                  activity.
                </p>

                {app.workshop_photo_observations?.length > 0 && (
                  <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-ink/80">
                    {app.workshop_photo_observations.map(
                      (observation, index) => (
                        <li key={`${observation}-${index}`}>{observation}</li>
                      ),
                    )}
                  </ul>
                )}
              </div>
            )}

            {app.workshop_photo_is_workshop && (
              <p className="mt-1 text-sm text-forest">
                ✓ No major exclusion factor detected.
              </p>
            )}
          </div>
        )}

        {/* ================================================= */}
        {/* SCORE */}
        {/* ================================================= */}

        {tab === "score" && (
          <div>
            <div className="flex items-center gap-5 rounded-xl2 border border-coffee/10 bg-paper p-6 shadow-card">
              <ScoreCircle score={finalScore} />

              <div>
                <p className="font-semibold text-ink">Provisional Score</p>

                <p className="mt-1 text-sm text-ink/50">
                  This score is generated from the information currently
                  available.
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3">
              {scoreItems.map((item) => (
                <div
                  key={item.key}
                  className="rounded-xl2 border border-coffee/10 bg-paper p-5 shadow-card"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-ink">{item.label}</p>

                    <ScoreBar score={item.score} max={item.max} />
                  </div>

                  <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-ink/40">
                    Why
                  </p>

                  <p className="mt-1 text-sm text-ink/80">{item.reason}</p>

                  <p className="mt-2 text-xs text-ink/40">
                    Source:{" "}
                    {item.evidence.length
                      ? item.evidence.join(", ")
                      : "AI analysis"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================================================= */}
        {/* DECLARATIONS */}
        {/* ================================================= */}

        {tab === "declarations" && (
          <div className="flex flex-col gap-4">
            {declarations.map((declaration, index) => (
              <div
                key={declaration.id}
                className="rounded-xl2 border border-coffee/10 bg-paper p-6 shadow-card"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-ink/40">
                  {t.applicant.declarations} {index + 1} / {declarations.length}
                </p>

                <p className="mt-2 font-semibold text-ink">
                  {declaration.title}
                </p>

                <p className="mt-1 text-sm text-ink/70">{declaration.text}</p>

                <button className="mt-3 text-sm font-semibold text-gold-dark hover:underline">
                  🔊 {t.applicant.explainIn}
                </button>

                <div className="mt-4 flex items-center gap-3">
                  <button
                    onClick={() => handleAcceptDeclaration(declaration.id)}
                    disabled={busy || declaration.accepted}
                    className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                      declaration.accepted
                        ? "bg-forest-light text-forest"
                        : "bg-coffee text-white hover:bg-ink"
                    }`}
                  >
                    {declaration.accepted ? "✓ " : ""}
                    {declaration.accepted
                      ? "Accepted"
                      : t.applicant.iUnderstand}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ================================================= */}
        {/* FINAL REVIEW */}
        {/* ================================================= */}

        {tab === "review" && (
          <div className="rounded-xl2 border border-coffee/10 bg-paper p-6 shadow-card">
            <InfoGrid
              rows={[
                [
                  "Business",
                  app.business_license_business_name ||
                    app.implementing_organisation,
                ],
                ["Project", app.project_name || "Not provided"],
                ["Eligibility", isEligible ? "Eligible" : "Needs Review"],
                ["Score", `${finalScore} / 100`],
                [
                  "Missing information",
                  String(missing.filter((m) => !m.value).length),
                ],
                [
                  "Declarations",
                  `${
                    declarations.filter((d) => d.accepted).length
                  }/${declarations.length}`,
                ],
              ]}
            />

            <div className="mt-6 rounded-lg bg-cream p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink/40">
                Final Proposal
              </p>

              <p className="mt-2 text-sm leading-6 text-ink/80">
                {app.project_description ||
                  app.problem ||
                  "No project description provided."}
              </p>
            </div>

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

/* ============================================================= */
/* COMPONENTS */
/* ============================================================= */

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
        {rows.map(([key, value]) => (
          <div key={key}>
            <dt className="text-xs text-ink/40">{key}</dt>

            <dd className="mt-1 text-sm font-medium text-ink">
              {value || "Not provided"}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function TextCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-xl2 border border-coffee/10 bg-paper p-6 shadow-card">
      <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-ink/40">
        {title}
      </p>

      <p className="text-sm leading-6 text-ink/80">{text || "Not provided"}</p>
    </div>
  );
}

function VerificationCard({
  label,
  verified,
  value,
}: {
  label: string;
  verified: boolean;
  value: string;
}) {
  return (
    <div className="rounded-xl2 border border-coffee/10 bg-paper p-5 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold text-ink">{label}</p>

        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            verified ? "bg-forest-light text-forest" : "bg-clay-light text-clay"
          }`}
        >
          {verified ? "Verified" : "Needs Review"}
        </span>
      </div>

      <p className="mt-2 text-lg text-ink">{value || "Not provided"}</p>

      <p className="mt-2 trail-dot pl-3 text-xs font-medium uppercase tracking-wide text-ink/40">
        Source: AI analysis
      </p>
    </div>
  );
}

function EligibilityPill({ eligible }: { eligible: boolean }) {
  return (
    <div
      className={`rounded-full px-4 py-2 text-sm font-semibold ${
        eligible ? "bg-forest-light text-forest" : "bg-clay-light text-clay"
      }`}
    >
      {eligible ? "Eligible" : "Needs Review"}
    </div>
  );
}

function ScoreCircle({ score }: { score: number }) {
  return (
    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-4 border-gold bg-paper">
      <div className="text-center">
        <div className="text-xl font-bold text-coffee">{score}</div>

        <div className="text-[10px] text-ink/40">/ 100</div>
      </div>
    </div>
  );
}

function ScoreBar({ score, max }: { score: number; max: number }) {
  const percentage = max > 0 ? (score / max) * 100 : 0;

  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-24 overflow-hidden rounded-full bg-coffee/10">
        <div
          className="h-full rounded-full bg-gold"
          style={{
            width: `${percentage}%`,
          }}
        />
      </div>

      <span className="text-xs font-semibold text-ink/60">
        {score}/{max}
      </span>
    </div>
  );
}
