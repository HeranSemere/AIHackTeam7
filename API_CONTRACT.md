# API Contract — what your backend needs to implement

> **Note:** the app doesn't need this to run today. With no
> `NEXT_PUBLIC_API_BASE_URL` set, `lib/api.ts` automatically uses
> `public/data/applications.json` as test data instead (see
> `lib/localData.ts`). This document describes what to build so that setting
> `NEXT_PUBLIC_API_BASE_URL` later works as a drop-in replacement.

The frontend calls these endpoints through `lib/api.ts`, relative to
`NEXT_PUBLIC_API_BASE_URL`. Every response that returns "an Application"
must match the `Application` shape in `lib/types.ts` exactly (field names,
nesting, enums) — that's the single source of truth both portals render from.

All request/response bodies are JSON except `analyze`, which is multipart.

---

## Applicant Portal

### `GET /applicant/applications`
List the current applicant's applications, for the dashboard.
→ `200 Application[]`

### `GET /applicant/applications/:id`
→ `200 Application`
→ `404` if not found

### `POST /applicant/applications/analyze`
**multipart/form-data**, sent all at once from the wizard's final step:
| field | type | notes |
|---|---|---|
| `voice` | file (audio/webm or audio/*) | the recorded or uploaded voice note |
| `voiceLang` | text | `"en"` \| `"am"` \| `"om"` |
| `licence` | file (image/* or application/pdf) | business licence |
| `photo` | file (image/*) | business/workshop photo |

This is where your backend runs speech-to-text on `voice`, OCR/vision
extraction on `licence`, and the scoring/eligibility/contradiction-detection
agent — then assembles and returns the full generated application.
→ `201 Application` (with a real `id` the frontend then redirects to)
→ `4xx { message: string }` on failure (e.g. unreadable audio, no business
detected) — the wizard shows `message` to the applicant with a retry button.

### `PATCH /applicant/applications/:id/missing/:fieldId`
Applicant fills in a previously-missing field.
Body: `{ "value": string }`
→ `200 Application` (updated — the field should move out of `missing` and
into `evidence` with an appropriate status)

### `PATCH /applicant/applications/:id/declarations/:declarationId`
Body: `{ "accepted": true }`
→ `200 Application`

### `PATCH /applicant/applications/:id/proposal`
Body: `Partial<Application["proposal"]>` (any subset of proposal fields)
→ `200 Application`

### `POST /applicant/applications/:id/submit`
Requires all declarations accepted server-side too (don't trust the client).
→ `200 Application` (with `status: "submitted"`)
→ `400 { message }` if declarations aren't all accepted

---

## Reviewer Portal

### `GET /reviewer/applications`
All applications visible to reviewers (used by the dashboard, the list, and
the shortlist — the frontend computes stats/filters/sorting client-side from
this one list).
→ `200 Application[]`

### `GET /reviewer/applications/:id`
→ `200 Application`
→ `404` if not found

### `POST /reviewer/applications/:id/decision`
Body: `{ "choice": "approve" | "moreInfo" | "reject", "notes": string }`
→ `200 Application` (with `reviewerDecision` set)

### `PATCH /reviewer/applications/:id/shortlist`
Body: `{ "shortlisted": boolean }`
→ `200 Application`

### `POST /reviewer/applications/:id/request-verification`
No body needed — logs/flags the application for a site visit / verification
follow-up on your side.
→ `204 No Content`

---

## Auth

If your backend requires auth, either:
- Set `NEXT_PUBLIC_API_TOKEN` in `.env.local` — every request from `lib/api.ts`
  sends it as `Authorization: Bearer <token>`. Fine for a shared/service
  token; do **not** put a real user secret here since it ships to the browser.
- For per-user login (real applicant/reviewer accounts), you'll want to add
  a proper auth flow (e.g. NextAuth or your own session cookies) — that's not
  wired up in this prototype and would replace the bearer-token approach.

## Errors

Any non-2xx response is treated as a failure. If the body is JSON with a
`message` field, that message is shown to the user; otherwise a generic
"Request failed" message is shown. Every fetching screen has a "Try again"
button that retries the same request.

## CORS

Since the frontend calls your backend directly from the browser, your backend
must send CORS headers allowing the frontend's origin (`Access-Control-Allow-Origin`,
and `Access-Control-Allow-Methods` including `GET, POST, PATCH`).
