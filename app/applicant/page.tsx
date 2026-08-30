"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { fetchApplicantApplications } from "@/lib/api";
import { Application } from "@/lib/types";
import { LoadingState, ErrorState } from "@/components/RequestState";

export default function ApplicantDashboard() {
  const { t } = useLanguage();
  const [apps, setApps] = useState<Application[] | null>(null);
  const [error, setError] = useState<React.ReactNode | null>(null);

  function load() {
    setError(null);

    fetchApplicantApplications()
      .then(setApps)
      .catch((e) => setError(String(e)));
  }

  useEffect(() => {
    load();
  }, []);

  const drafts = apps?.filter((app) => app.status === "draft") ?? [];

  const recentApplications =
    apps?.filter((app) => app.status !== "draft").slice(0, 3) ?? [];

  return (
    <div className="mx-auto w-full">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-[2rem] bg-coffee px-6 py-10 text-white shadow-card sm:px-10 sm:py-14">
        <div className="relative z-10 max-w-2xl">
          <p className="text-sm font-semibold tracking-wide text-gold">
            {t.applicant.welcome}
          </p>

          <h1 className="mt-2 font-display text-3xl font-semibold leading-tight sm:text-5xl">
            Turn your business idea into a funding application.
          </h1>

          <p className="mt-4 max-w-xl text-sm leading-6 text-white/70 sm:text-base">
            Tell us about your business using your voice, photos, and documents.
            Our AI helps turn your story into a complete, structured funding
            proposal without guessing information.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/applicant/new"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-gold px-6 py-3.5 text-sm font-bold text-ink transition hover:bg-white"
            >
              <span className="text-lg">+</span>
              Apply for Funding
            </Link>

            <Link
              href="/applicant/new?type=impact"
              className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/15"
            >
              Start an Impact Project
            </Link>
          </div>
        </div>

        {/* Decorative shapes */}
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full border border-white/10" />
        <div className="absolute -bottom-32 right-10 h-72 w-72 rounded-full border border-gold/10" />
      </section>

      {/* Main actions */}
      <section className="mt-8">
        <div className="mb-4">
          <h2 className="font-display text-xl font-semibold text-ink">
            What would you like to do?
          </h2>

          <p className="mt-1 text-sm text-ink/50">
            Choose how you want to get started.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {/* Funding */}
          <Link
            href="/applicant/new"
            className="group rounded-xl2 border border-coffee/10 bg-paper p-6 shadow-card transition hover:-translate-y-1 hover:border-gold hover:shadow-lg"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gold/10 text-2xl">
              💰
            </div>

            <h3 className="mt-5 font-display text-lg font-semibold text-ink">
              Apply for Funding
            </h3>

            <p className="mt-2 text-sm leading-6 text-ink/50">
              Share your business story by voice, upload your licence and
              workshop photo, and build your funding application.
            </p>

            <span className="mt-5 inline-flex text-sm font-bold text-gold-dark transition group-hover:translate-x-1">
              Start application →
            </span>
          </Link>

          {/* Impact */}
          <Link
            href="/applicant/new?type=impact"
            className="group rounded-xl2 border border-coffee/10 bg-paper p-6 shadow-card transition hover:-translate-y-1 hover:border-gold hover:shadow-lg"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-forest-light text-2xl">
              🌱
            </div>

            <h3 className="mt-5 font-display text-lg font-semibold text-ink">
              Create an Impact Project
            </h3>

            <p className="mt-2 text-sm leading-6 text-ink/50">
              Turn your idea into an ImpactProtocol project with goals,
              beneficiaries, SDGs, milestones, and a funding target.
            </p>

            <span className="mt-5 inline-flex text-sm font-bold text-gold-dark transition group-hover:translate-x-1">
              Create project →
            </span>
          </Link>

          {/* Help */}
          <Link
            href="/applicant/how-it-works"
            className="group rounded-xl2 border border-coffee/10 bg-paper p-6 shadow-card transition hover:-translate-y-1 hover:border-gold hover:shadow-lg"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-coffee/5 text-2xl">
              ✨
            </div>

            <h3 className="mt-5 font-display text-lg font-semibold text-ink">
              How It Works
            </h3>

            <p className="mt-2 text-sm leading-6 text-ink/50">
              Learn how your voice, photos, and documents are transformed into a
              structured and reviewable application.
            </p>

            <span className="mt-5 inline-flex text-sm font-bold text-gold-dark transition group-hover:translate-x-1">
              Learn more →
            </span>
          </Link>
        </div>
      </section>

      {/* Continue drafts */}
      {/* {apps && drafts.length > 0 && (
        <section className="mt-10">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl font-semibold text-ink">
                Continue where you left off
              </h2>

              <p className="mt-1 text-sm text-ink/50">
                You have {drafts.length} unfinished application
                {drafts.length > 1 ? "s" : ""}.
              </p>
            </div>
          </div>

          <div className="grid gap-3">
            {drafts.slice(0, 2).map((app) => (
              <Link
                key={app.id}
                href={`/applicant/${app.id}`}
                className="group flex flex-col gap-4 rounded-xl2 border border-gold/20 bg-gold/5 p-5 transition hover:border-gold sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate font-display text-lg font-semibold text-ink">
                    {app.businessName || "Untitled application"}
                  </p>

                  <p className="mt-1 text-sm text-ink/50">
                    Application progress: {app.progress}%
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-4">
                  <div className="h-2 w-28 overflow-hidden rounded-full bg-coffee/10">
                    <div
                      className="h-full rounded-full bg-gold"
                      style={{
                        width: `${Math.min(app.progress, 100)}%`,
                      }}
                    />
                  </div>

                  <span className="text-sm font-bold text-gold-dark">
                    Continue →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )} */}

      {/* Process */}
      <section className="mt-12">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold-dark">
            Simple application process
          </p>

          <h2 className="mt-2 font-display text-2xl font-semibold text-ink">
            You tell your story. We structure the application.
          </h2>
        </div>

        <div className="mt-7 grid gap-4 md:grid-cols-3">
          <Step
            number="01"
            title="Tell your story"
            description="Speak in Amharic, Oromo, or English and describe your business naturally."
          />

          <Step
            number="02"
            title="Add your evidence"
            description="Upload your business licence and a photo of your workshop or business."
          />

          <Step
            number="03"
            title="Review and submit"
            description="Review the generated application, complete missing information, and submit."
          />
        </div>
      </section>

      {/* Recent applications */}
      {/* {error && (
        <section className="mt-10">
          <ErrorState error={error} onRetry={load} />
        </section>
      )} */}

      {!error && !apps && (
        <section className="mt-10">
          <LoadingState />
        </section>
      )}

      {/* {recentApplications.length > 0 && (
        <section className="mt-12">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl font-semibold text-ink">
                Recent applications
              </h2>

              <p className="mt-1 text-sm text-ink/50">
                Track applications you have already submitted.
              </p>
            </div>

            <Link
              href="/applicant/applications"
              className="text-sm font-semibold text-gold-dark hover:text-ink"
            >
              View all →
            </Link>
          </div>

          <div className="grid gap-3">
            {recentApplications.map((app) => (
              <Link
                key={app.id}
                href={`/applicant/${app.id}`}
                className="flex items-center justify-between rounded-xl2 border border-coffee/10 bg-paper p-5 shadow-card transition hover:border-gold"
              >
                <div className="min-w-0">
                  <p className="truncate font-display text-lg font-semibold text-ink">
                    {app.businessName}
                  </p>

                  <p className="mt-1 text-sm text-ink/50">
                    {app.location}
                    {app.sector ? ` · ${app.sector}` : ""}
                  </p>
                </div>

                <div className="ml-4 flex shrink-0 items-center gap-3">
                  {app.finalScore != null && (
                    <span className="rounded-full bg-forest-light px-3 py-1 text-xs font-bold text-forest">
                      {app.finalScore}/100
                    </span>
                  )}

                  <span className="text-sm font-semibold text-gold-dark">
                    View →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )} */}
    </div>
  );
}

function Step({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl2 border border-coffee/10 bg-paper p-6 shadow-card">
      <span className="text-xs font-bold tracking-widest text-gold-dark">
        {number}
      </span>

      <h3 className="mt-3 font-display text-lg font-semibold text-ink">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-ink/50">{description}</p>
    </div>
  );
}
