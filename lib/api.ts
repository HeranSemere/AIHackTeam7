import { Application } from "./types";
import { localData } from "./localData";

/**
 * ============================================================================
 * THIS IS THE ONLY FILE THAT KNOWS ABOUT THE BACKEND.
 *
 * TEST MODE (default): if NEXT_PUBLIC_API_BASE_URL is not set, every function
 * below reads/writes public/data/applications.json via lib/localData.ts, so
 * the whole app works end-to-end with no backend.
 *
 * REAL MODE: set NEXT_PUBLIC_API_BASE_URL in .env.local to your deployed
 * backend's URL (see .env.local.example) and every function below switches
 * to real HTTP requests instead. No page component ever needs to change.
 *
 * See API_CONTRACT.md for the exact endpoints/JSON shapes your backend needs
 * to implement to match what this file expects in real mode.
 * ============================================================================
 */

function hasBackend(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_API_BASE_URL);
}

function apiBase(): string {
  return (process.env.NEXT_PUBLIC_API_BASE_URL as string).replace(/\/$/, "");
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/**
 * Optional bearer token, if your backend requires auth.
 * Set NEXT_PUBLIC_API_TOKEN in .env.local. Note: anything prefixed
 * NEXT_PUBLIC_ is visible in the browser bundle - fine for a shared/service
 * token, NOT safe for a secret that must stay private. If you need a private
 * secret, add a Next.js API route as a server-side proxy instead of calling
 * the backend directly from the client.
 */
function authHeaders(): HeadersInit {
  const token = process.env.NEXT_PUBLIC_API_TOKEN;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const isFormData = options.body instanceof FormData;
  const res = await fetch(`${apiBase()}${path}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...authHeaders(),
      ...(options.headers || {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    let message = `Request to ${path} failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.message) message = body.message;
    } catch {
      /* response wasn't JSON, keep the default message */
    }
    throw new ApiError(message, res.status);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

/* ---------------------------------------------------------------------- */
/* Applicant Portal                                                        */
/* ---------------------------------------------------------------------- */

export function fetchApplicantApplications(): Promise<Application[]> {
  if (!hasBackend()) return localData.list();
  return apiFetch<Application[]>("/applicant/applications");
}

export function fetchApplicantApplication(id: string): Promise<Application> {
  if (!hasBackend()) return localData.get(id);
  return apiFetch<Application>(`/applicant/applications/${id}`);
}

/**
 * Sends the voice recording, licence photo, and business photo together in
 * ONE multipart request, and expects the fully-generated Application back
 * (this is where your backend runs speech-to-text, OCR, and the scoring
 * agent, then returns the structured result). In test mode this just clones
 * a sample application so the flow can be exercised end-to-end.
 */
export function analyzeApplication(input: {
  voiceBlob: Blob;
  voiceLang: string;
  licenceFile: File;
  photoFile: File;
}): Promise<Application> {
  if (!hasBackend()) return localData.analyze();

  const form = new FormData();
  form.append("voice", input.voiceBlob, "voice-note.webm");
  form.append("voiceLang", input.voiceLang);
  form.append("licence", input.licenceFile);
  form.append("photo", input.photoFile);

  return apiFetch<Application>("/applicant/applications/analyze", {
    method: "POST",
    body: form,
  });
}

export function addMissingInfo(appId: string, fieldId: string, value: string): Promise<Application> {
  if (!hasBackend()) return localData.patchMissing(appId, fieldId, value);
  return apiFetch<Application>(`/applicant/applications/${appId}/missing/${fieldId}`, {
    method: "PATCH",
    body: JSON.stringify({ value }),
  });
}

export function acceptDeclaration(appId: string, declarationId: string): Promise<Application> {
  if (!hasBackend()) return localData.patchDeclaration(appId, declarationId);
  return apiFetch<Application>(`/applicant/applications/${appId}/declarations/${declarationId}`, {
    method: "PATCH",
    body: JSON.stringify({ accepted: true }),
  });
}

export function updateProposal(appId: string, proposal: Partial<Application["proposal"]>): Promise<Application> {
  if (!hasBackend()) return localData.patchProposal(appId, proposal);
  return apiFetch<Application>(`/applicant/applications/${appId}/proposal`, {
    method: "PATCH",
    body: JSON.stringify(proposal),
  });
}

export function submitApplication(appId: string): Promise<Application> {
  if (!hasBackend()) return localData.submit(appId);
  return apiFetch<Application>(`/applicant/applications/${appId}/submit`, {
    method: "POST",
  });
}

/* ---------------------------------------------------------------------- */
/* Reviewer Portal                                                         */
/* ---------------------------------------------------------------------- */

export function fetchReviewerApplications(): Promise<Application[]> {
  if (!hasBackend()) return localData.list();
  return apiFetch<Application[]>("/reviewer/applications");
}

export function fetchReviewerApplication(id: string): Promise<Application> {
  if (!hasBackend()) return localData.get(id);
  return apiFetch<Application>(`/reviewer/applications/${id}`);
}

export function saveReviewerDecision(
  appId: string,
  choice: "approve" | "moreInfo" | "reject",
  notes: string
): Promise<Application> {
  if (!hasBackend()) return localData.saveDecision(appId, choice, notes);
  return apiFetch<Application>(`/reviewer/applications/${appId}/decision`, {
    method: "POST",
    body: JSON.stringify({ choice, notes }),
  });
}

export function setShortlisted(appId: string, shortlisted: boolean): Promise<Application> {
  if (!hasBackend()) return localData.setShortlisted(appId, shortlisted);
  return apiFetch<Application>(`/reviewer/applications/${appId}/shortlist`, {
    method: "PATCH",
    body: JSON.stringify({ shortlisted }),
  });
}

export function requestVerification(appId: string): Promise<void> {
  if (!hasBackend()) return localData.requestVerification();
  return apiFetch<void>(`/reviewer/applications/${appId}/request-verification`, {
    method: "POST",
  });
}
