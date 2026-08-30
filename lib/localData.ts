import { Application } from "./types";

/**
 * TEST-MODE DATA LAYER.
 *
 * Used automatically whenever NEXT_PUBLIC_API_BASE_URL is not set (see
 * lib/api.ts). Reads public/data/applications.json once, then serves and
 * mutates an in-memory copy so every screen and action in both portals
 * works end-to-end without a real backend.
 *
 * This is only for testing the frontend. Nothing here is persisted -
 * mutations (declarations, decisions, shortlist, etc.) live only in memory
 * and reset on a full page reload. Once your backend is ready, set
 * NEXT_PUBLIC_API_BASE_URL and lib/api.ts stops using this file entirely.
 */

let cache: Application[] | null = null;
let loading: Promise<Application[]> | null = null;

async function loadAll(): Promise<Application[]> {
  if (cache) return cache;
  if (!loading) {
    loading = fetch("/data/applications.json")
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load test data (/data/applications.json, ${res.status})`);
        return res.json();
      })
      .then((data: Application[]) => {
        cache = data;
        return data;
      });
  }
  return loading;
}

function withDelay<T>(value: T, ms = 350): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function findOrThrow(list: Application[], id: string): Application {
  const app = list.find((a) => a.id === id);
  if (!app) throw new Error(`No application "${id}" in the test dataset.`);
  return app;
}

export const localData = {
  async list(): Promise<Application[]> {
    return withDelay(await loadAll());
  },

  async get(id: string): Promise<Application> {
    const all = await loadAll();
    return withDelay(findOrThrow(all, id));
  },

  /**
   * There's no real AI pipeline in test mode, so this just clones one of the
   * sample applications under a fresh id and returns it - enough to exercise
   * the full "analyze -> generated application" flow end-to-end.
   */
  async analyze(): Promise<Application> {
    const all = await loadAll();
    const template = all[0];
    const generated: Application = JSON.parse(JSON.stringify(template));
    generated.id = `${template.id}-${Date.now()}`;
    generated.status = "needsReview";
    all.push(generated);
    return withDelay(generated, 700);
  },

  async patchMissing(appId: string, fieldId: string, value: string): Promise<Application> {
    const all = await loadAll();
    const app = findOrThrow(all, appId);
    app.missing = app.missing.filter((m) => m.id !== fieldId);
    app.evidence = [...app.evidence, { label: fieldId, value, status: "needsConfirmation", source: "Applicant" }];
    return withDelay(app);
  },

  async patchDeclaration(appId: string, declarationId: string): Promise<Application> {
    const all = await loadAll();
    const app = findOrThrow(all, appId);
    app.declarations = app.declarations.map((d) => (d.id === declarationId ? { ...d, accepted: true, explained: true } : d));
    return withDelay(app);
  },

  async patchProposal(appId: string, proposal: Partial<Application["proposal"]>): Promise<Application> {
    const all = await loadAll();
    const app = findOrThrow(all, appId);
    app.proposal = { ...app.proposal, ...proposal };
    return withDelay(app);
  },

  async submit(appId: string): Promise<Application> {
    const all = await loadAll();
    const app = findOrThrow(all, appId);
    if (!app.declarations.every((d) => d.accepted)) {
      throw new Error("All declarations must be accepted before submitting.");
    }
    app.status = "submitted";
    return withDelay(app);
  },

  async saveDecision(appId: string, choice: "approve" | "moreInfo" | "reject", notes: string): Promise<Application> {
    const all = await loadAll();
    const app = findOrThrow(all, appId);
    app.reviewerDecision = { choice, notes };
    return withDelay(app);
  },

  async setShortlisted(appId: string, shortlisted: boolean): Promise<Application> {
    const all = await loadAll();
    const app = findOrThrow(all, appId);
    app.shortlisted = shortlisted;
    return withDelay(app);
  },

  async requestVerification(): Promise<void> {
    return withDelay(undefined, 250);
  },
};
