"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { analyzeApplication } from "@/lib/api";
import { ErrorState } from "@/components/RequestState";

type Step = 1 | 2 | 3;

const VOICE_LANGS = [
  { code: "en", label: "English" },
  { code: "am", label: "አማርኛ" },
  { code: "om", label: "Afaan Oromoo" },
];

const PROCESSING_STEPS = [
  "Voice received",
  "Language detected",
  "Voice transcribed",
  "Licence analyzed",
  "Business information extracted",
  "Building application",
  "Checking eligibility",
  "Creating proposal",
];

export default function NewApplication() {
  const { t, locale } = useLanguage();
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);

  // Step 1 - voice
  const [voiceLang, setVoiceLang] = useState(locale);
  const [recording, setRecording] = useState(false);
  const [voiceBlob, setVoiceBlob] = useState<Blob | null>(null);
  const [micError, setMicError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const voiceInputRef = useRef<HTMLInputElement>(null);

  // Step 2 - licence
  const [licenceFile, setLicenceFile] = useState<File | null>(null);
  const [licencePreview, setLicencePreview] = useState<string | null>(null);
  const licenceInputRef = useRef<HTMLInputElement>(null);

  // Step 3 - business photo
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Analyze / backend call
  const [analyzing, setAnalyzing] = useState(false);
  const [checks, setChecks] = useState(0);
  const [analyzeError, setAnalyzeError] = useState<unknown>(null);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((tr) => tr.stop());
    };
  }, []);

  async function startRecording() {
    setMicError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "";
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType || "audio/webm" });
        setVoiceBlob(blob);
        streamRef.current?.getTracks().forEach((tr) => tr.stop());
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
    } catch {
      setMicError("Microphone access was denied or is unavailable. You can upload a voice note instead.");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }

  function onVoiceFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setVoiceBlob(file);
  }

  function onLicencePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLicenceFile(file);
    setLicencePreview(URL.createObjectURL(file));
  }

  function onPhotoPicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function handleAnalyze() {
    if (!voiceBlob || !licenceFile || !photoFile) return;
    setAnalyzing(true);
    setAnalyzeError(null);
    setChecks(0);

    // Purely visual progress while the real request is in flight - stops one
    // step short so it doesn't finish before the backend actually responds.
    const ticker = setInterval(() => {
      setChecks((c) => Math.min(c + 1, PROCESSING_STEPS.length - 1));
    }, 550);

    try {
      const application = await analyzeApplication({ voiceBlob, voiceLang, licenceFile, photoFile });
      clearInterval(ticker);
      setChecks(PROCESSING_STEPS.length);
      setTimeout(() => router.push(`/applicant/${application.id}?generated=1`), 500);
    } catch (err) {
      clearInterval(ticker);
      setAnalyzing(false);
      setAnalyzeError(err);
    }
  }

  const canAnalyze = Boolean(voiceBlob && licenceFile && photoFile);

  if (analyzing) {
    return (
      <div className="mx-auto max-w-md py-10">
        <p className="text-center text-sm font-semibold uppercase tracking-wide text-gold-dark">{t.applicant.processingTitle}</p>
        <div className="mx-auto my-8 flex h-20 items-end justify-center gap-1.5" aria-hidden>
          {[0.5, 0.8, 1, 0.4, 0.7, 0.9, 0.35].map((d, i) => (
            <span key={i} className="wave-bar w-2 rounded-full bg-gold" style={{ height: `${d * 72}px`, animationDelay: `${i * 0.09}s` }} />
          ))}
        </div>
        <ul className="flex flex-col gap-3 rounded-xl2 border border-coffee/10 bg-paper p-6 shadow-card">
          {PROCESSING_STEPS.map((s, i) => (
            <li key={s} className="flex items-center gap-3 text-sm">
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  i < checks ? "bg-forest text-white" : i === checks ? "border-2 border-gold text-gold-dark" : "border border-coffee/20 text-transparent"
                }`}
              >
                {i < checks ? "✓" : i === checks ? "●" : "○"}
              </span>
              <span className={i <= checks ? "text-ink" : "text-ink/40"}>{s}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (analyzeError) {
    return (
      <div className="py-10">
        <ErrorState error={analyzeError} onRetry={handleAnalyze} />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-center gap-2" aria-label="progress">
        {[1, 2, 3].map((s) => (
          <div key={s} className={`h-1.5 flex-1 rounded-full ${s <= step ? "bg-gold" : "bg-coffee/10"}`} />
        ))}
      </div>

      {step === 1 && (
        <section>
          <h1 className="font-display text-2xl font-semibold text-ink">{t.applicant.step1}</h1>
          <p className="mt-2 text-ink/60">{t.applicant.step1Sub}</p>

          <div className="mt-6 flex flex-wrap gap-2">
            {VOICE_LANGS.map((l) => (
              <button
                key={l.code}
                onClick={() => setVoiceLang(l.code as typeof locale)}
                className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                  voiceLang === l.code ? "border-gold bg-gold-light text-coffee" : "border-coffee/15 text-ink/60 hover:border-gold"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>

          <div className="mt-8 flex flex-col items-center gap-6 rounded-xl2 border border-coffee/10 bg-paper p-10 shadow-card">
            {recording ? (
              <div className="flex h-16 items-end gap-1.5" aria-hidden>
                {[0.4, 0.8, 1, 0.5, 0.9, 0.3, 0.7].map((d, i) => (
                  <span key={i} className="wave-bar w-2 rounded-full bg-clay" style={{ height: `${d * 64}px`, animationDelay: `${i * 0.08}s` }} />
                ))}
              </div>
            ) : (
              <div className={`flex h-16 w-16 items-center justify-center rounded-full text-2xl ${voiceBlob ? "bg-forest-light" : "bg-gold-light"}`}>
                {voiceBlob ? "✓" : "🎙️"}
              </div>
            )}

            <button
              onClick={() => (recording ? stopRecording() : voiceBlob ? setVoiceBlob(null) : startRecording())}
              className="w-full rounded-full bg-coffee px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-ink"
            >
              {recording ? t.applicant.stopRecording : voiceBlob ? t.applicant.recordAgain : t.applicant.startRecording}
            </button>

            {micError && <p className="text-center text-sm text-clay">{micError}</p>}

            {!recording && (
              <>
                <input ref={voiceInputRef} type="file" accept="audio/*" className="hidden" onChange={onVoiceFilePicked} />
                <button onClick={() => voiceInputRef.current?.click()} className="text-sm font-semibold text-gold-dark hover:underline">
                  {t.applicant.uploadVoice}
                </button>
              </>
            )}
          </div>
        </section>
      )}

      {step === 2 && (
        <section>
          <h1 className="font-display text-2xl font-semibold text-ink">{t.applicant.step2}</h1>
          <p className="mt-2 text-ink/60">{t.applicant.step2Sub}</p>
          <div className="mt-8 rounded-xl2 border border-coffee/10 bg-paper p-6 shadow-card">
            <input
              ref={licenceInputRef}
              type="file"
              accept="image/*,application/pdf"
              capture="environment"
              className="hidden"
              onChange={onLicencePicked}
            />
            {licencePreview ? (
              <div className="flex items-center gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={licencePreview} alt="Business licence preview" className="h-24 w-32 rounded-lg object-cover" />
                <button
                  onClick={() => {
                    setLicenceFile(null);
                    setLicencePreview(null);
                  }}
                  className="text-sm font-semibold text-clay hover:underline"
                >
                  {t.common.remove}
                </button>
              </div>
            ) : (
              <button
                onClick={() => licenceInputRef.current?.click()}
                className="flex w-full flex-col items-center gap-3 rounded-xl border-2 border-dashed border-coffee/20 py-10 text-sm font-semibold text-coffee hover:border-gold"
              >
                <span className="text-2xl">📄</span>
                {t.applicant.uploadLicence}
              </button>
            )}
          </div>
        </section>
      )}

      {step === 3 && (
        <section>
          <h1 className="font-display text-2xl font-semibold text-ink">{t.applicant.step3}</h1>
          <p className="mt-2 text-ink/60">{t.applicant.step3Sub}</p>
          <div className="mt-8 rounded-xl2 border border-coffee/10 bg-paper p-6 shadow-card">
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={onPhotoPicked}
            />
            {photoPreview ? (
              <div className="flex items-center gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photoPreview} alt="Business photo preview" className="h-24 w-32 rounded-lg object-cover" />
                <button
                  onClick={() => {
                    setPhotoFile(null);
                    setPhotoPreview(null);
                  }}
                  className="text-sm font-semibold text-clay hover:underline"
                >
                  {t.common.remove}
                </button>
              </div>
            ) : (
              <button
                onClick={() => photoInputRef.current?.click()}
                className="flex w-full flex-col items-center gap-3 rounded-xl border-2 border-dashed border-coffee/20 py-10 text-sm font-semibold text-coffee hover:border-gold"
              >
                <span className="text-2xl">📷</span>
                {t.applicant.uploadPhoto}
              </button>
            )}
          </div>
        </section>
      )}

      <div className="mt-8 flex items-center justify-between">
        <button
          onClick={() => setStep((s) => (s > 1 ? ((s - 1) as Step) : s))}
          className={`text-sm font-semibold text-ink/50 hover:text-ink ${step === 1 ? "invisible" : ""}`}
        >
          ← {t.common.back}
        </button>

        {step < 3 ? (
          <button
            onClick={() => setStep((s) => ((s + 1) as Step))}
            disabled={step === 1 ? !voiceBlob : !licenceFile}
            className="rounded-full bg-coffee px-6 py-3 text-sm font-semibold text-white transition hover:bg-ink disabled:opacity-40"
          >
            {t.common.next} →
          </button>
        ) : (
          <button
            onClick={handleAnalyze}
            disabled={!canAnalyze}
            className="rounded-full bg-gold px-6 py-3 text-sm font-semibold text-coffee shadow-card transition hover:bg-gold-dark hover:text-white disabled:opacity-40"
          >
            {t.applicant.analyzeButton}
          </button>
        )}
      </div>
    </div>
  );
}
