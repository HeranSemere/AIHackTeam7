# FundAI Ethiopia

A single Next.js 14 (App Router + TypeScript + Tailwind) codebase containing
**both** the Applicant Portal and the Reviewer Portal. Works fully with
local test data out of the box, and switches to your real backend the
moment you set one config value.

## Test it right now, no backend needed

```bash
npm install
npm run dev
```

Open http://localhost:3000. With no `.env.local`, the app automatically
reads from `public/data/applications.json` and simulates every action
(analyze, save decision, accept declaration, shortlist, submit...) against
an in-memory copy of that data — the whole app works end-to-end for testing
and demos, no backend required.

## Connect your real backend later (the only change you'll need)

```bash
cp .env.local.example .env.local
```

Open `.env.local` and set:

```
NEXT_PUBLIC_API_BASE_URL=https://your-deployed-backend.example.com/api
```

The moment this is set, `lib/api.ts` switches every function from reading
the local JSON file to making real HTTP requests against your backend.
No page component changes either way.

Your backend needs to implement the endpoints in **`API_CONTRACT.md`** —
that's the exact contract (methods, request/response JSON shapes) this
frontend expects. `lib/types.ts` is the single source of truth for the
`Application` shape every response must match, and
`public/data/applications.json` is a working example of that shape with 5
realistic sample applications (also handy as backend seed data).

## What you'll find on each URL

- **`/applicant`** — dashboard (fetches the applicant's applications) →
  new-application wizard (real microphone recording via `MediaRecorder`,
  real file pickers for licence/business photo, all three sent together in
  one request to `POST /applicant/applications/analyze`) → the generated
  application, with tabs wired to real actions: filling in missing info,
  accepting declarations, and submitting.
- **`/reviewer`** — dashboard, a searchable/filterable/sortable application
  list, a detail view with tabs for evidence/scoring/contradictions/etc, and
  a shortlist — all fetched live, with decision-saving, shortlisting, and
  verification requests wired to real actions.

Language switches (English / አማርኛ / Afaan Oromoo) via the header dropdown,
persisted in `localStorage`.

## Test mode vs. real mode - what's different

- **Every screen fetches through `lib/api.ts` either way** — no page ever
  imports data directly, so nothing changes in `app/` when you switch modes.
- **Test mode** (no `.env.local`): `lib/api.ts` reads/writes an in-memory
  copy of `public/data/applications.json` (see `lib/localData.ts`). Good for
  demos and UI testing, but nothing persists across a full page reload, and
  "Analyze My Business" doesn't run real AI — it just clones a sample
  application so you can see the full flow.
- **Real mode** (`.env.local` set): `lib/api.ts` makes real HTTP requests to
  your backend. This is where actual speech-to-text, OCR, and the
  scoring/eligibility agent need to live — see `API_CONTRACT.md` for exactly
  what `POST /applicant/applications/analyze` and every other endpoint must
  return.
- If your backend needs auth, see the "Auth" section in `API_CONTRACT.md`.
- CORS: in real mode, since the browser calls your backend directly, your
  backend must return CORS headers allowing this frontend's origin.

## Structure

```
app/
  page.tsx                 portal picker
  applicant/
    page.tsx                 dashboard (GET /applicant/applications)
    new/page.tsx                wizard: mic + file capture -> POST .../analyze
    [id]/page.tsx                 generated application (tabbed, live actions)
  reviewer/
    page.tsx                  dashboard (GET /reviewer/applications)
    applications/page.tsx       searchable/filterable list
    applications/[id]/page.tsx    detail (tabbed, live decision/shortlist actions)
    shortlist/page.tsx          ranked shortlist
components/
  RequestState.tsx           shared loading/error UI
  StatusBadge.tsx, ScoreBits.tsx, LanguageSwitcher.tsx
lib/
  api.ts                     <- the ONLY file that knows about the backend
  localData.ts                test-mode data layer (used when no backend URL is set)
  types.ts                   shared Application shape (the contract)
  mockData.ts                 source used to generate applications.json, not imported by app/
  i18n/                       dictionaries + LanguageProvider
public/
  data/applications.json     test-mode dataset (5 sample applications)
API_CONTRACT.md              exact endpoints your backend must implement
.env.local.example           copy to .env.local when your backend is ready
```
