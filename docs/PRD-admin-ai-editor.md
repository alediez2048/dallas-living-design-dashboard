# PRD — Admin AI Editor for the Dallas Living Design Dashboard

**Status:** Draft for approval
**Branch:** `feature/admin-chat-assistant`
**Owner:** Jorge Diez (admin)
**Author:** drafted with Claude Code
**Platform:** Railway (persistent Node service + Postgres)

---

## 1. Summary

Give the dashboard **admin(s)** a signed-in chat interface where they can request changes to the
production dashboard in natural language — change a graph, a variable, the layout, the underlying
logic, the UX, the design — and have those changes reviewed, then **deployed to production for all
users**. Non-admin users continue to use the dashboard as they do today (public, no sign-in). This
replaces the current workflow of the owner hand-editing source files.

This is effectively an **AI app-editing agent** (in the family of v0 / Lovable / bolt), scoped to a
single repo that the admin owns, with a human-in-the-loop approval gate before anything reaches
production.

---

## 2. Goals / Non-goals

### Goals
- G1. Admins can request **code-level changes** (graphs, variables, layout, logic, UX, design) via chat.
- G2. Changes are generated as a reviewable **diff + preview deployment**, then published to production
  on explicit admin approval.
- G3. **Authentication** via Clerk. Only allow-listed admins can sign in; there is no public user funnel.
- G4. **Admins are double-gated**: allow-listed admin email **and** a valid admin code.
- G5. LLM provider is **bring-your-own-key** (OpenAI *or* Anthropic), entered in admin settings,
  **stored securely server-side** (never in the browser bundle).
- G6. When an admin publishes, the change **redeploys the shared production app** so everyone sees it.
- G7. Full **audit log** of every AI change (who, prompt, diff, deploy, outcome) with rollback.

### Non-goals (for this build)
- N1. Multi-tenant / per-user dashboard variants. There is **one** shared production dashboard.
- N2. Editing/persisting the *data*. Data stays **per-session upload** (see D-OQ1).
- N3. A general public sign-up funnel. Only admins authenticate.
- N4. Fully autonomous deploys with no human review. **Every** production change passes an admin gate.

---

## 3. Users & roles

| Role | How identified | Can do |
|------|----------------|--------|
| **Anonymous visitor** | not signed in | **view the public dashboard** (upload Excel, explore) |
| **Admin** | Clerk account whose email is on the admin allowlist **AND** who has entered the valid admin code | everything above **+** AI chat editor, settings (API keys), publish changes, audit log |

There is **no "authenticated non-admin"** tier — the dashboard is public to view, and the only reason
to authenticate is to act as an admin.

**Admin gate logic (enforced server-side on every privileged call):**
`isAdmin = clerkSessionValid AND email ∈ ADMIN_ALLOWLIST AND adminCodeVerified`.
The client never decides admin status; it only reflects what the backend asserts.

---

## 4. Decisions captured

| # | Decision |
|---|----------|
| D1 | Scope = **full production app**, **code-level** editing (not config-only). |
| D2 | Hosting + backend = **Railway** — one **persistent Node service** serves the API **and** the built React app. Provisioned via **Railway CLI** (user already on a paid plan). |
| D3 | Auth = **Clerk** (platform-agnostic SDK). |
| D4 | Persistence model = **single shared production dashboard**; admin change → deploy for everyone. |
| D5 | LLM = **BYO key**, OpenAI or Anthropic, added in admin **Settings**, stored server-side (encrypted). |
| D6 | **No public sign-up.** Only allow-listed admins authenticate; the dashboard is public to view. |
| D7 | Admin elevation = **email allowlist + admin code**. |
| D-OQ1 | **Data stays per-session upload** — not shared/persisted. |
| D-OQ2 | **Dashboard is public**; auth required only to become admin. |
| D-OQ3 | **Railway persistent service ⇒ no serverless timeout.** The code-editing agent runs in a single long-lived request; the async-job pattern is unnecessary. |

---

## 5. Assumptions & open items (please confirm)

- **A1.** The repo this agent edits is *this* repo, and deployment moves **GitHub Pages → Railway**. The
  existing GitHub Actions Pages workflow is retired.
- **A2.** Production changes flow through Git: agent commits to a branch → **Railway PR/preview
  environment** deploys it → admin approves → merge to `main` → Railway **production** redeploy.
  (Human gate = the approval step.)
- **A3.** The agent gets repo write access via a **scoped GitHub token / GitHub App** (contents +
  pull-requests), *not* the admin's personal credentials.
- **A4.** Datastore = **Railway Postgres** (added as a service; `DATABASE_URL` injected) for encrypted
  BYO API keys, admin settings, and the audit log.
- **OI-1 (Railway PR environments):** Confirm PR/preview environments are enabled on your Railway plan
  (needed for "preview before publish"). If not, fallback: a dedicated `staging` service that deploys
  the agent's branch for review.
- **OI-2 (server framework):** Backend proposed as **Node + Express (TypeScript)** serving `/api/*` and
  the static `dist/`. (Hono is an alternative; low stakes, swappable.)

---

## 6. Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│  Browser                                                            │
│   • Public dashboard SPA (Vite/React, served by the Node service)   │
│   • <ClerkProvider> — only used to sign in as admin                  │
│   • Admin-only UI: Chat editor, Settings (BYO key), Diff/Preview,    │
│     Audit log                                                        │
└───────────────┬─────────────────────────────────────────────────────┘
                │  HTTPS (Clerk session token on privileged calls)
                ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Railway service — ONE persistent Node/Express (TypeScript) process  │
│   • Serves static built frontend (dist/) at /                        │
│   • verifyAdmin()  → Clerk verify + allowlist + admin code           │
│   • POST /api/chat    → LLM proxy (holds provider key, streams)      │
│   • POST /api/edit    → agent: NL → code diff → commit to branch     │
│   •                     (runs as long as needed — no timeout)        │
│   • POST /api/publish → merge branch → main (triggers prod redeploy) │
│   • POST /api/keys    → store/rotate encrypted BYO API keys          │
│   • GET  /api/audit   → read audit log                               │
└───────┬───────────────────────┬───────────────────────┬─────────────┘
        │                       │                       │
        ▼                       ▼                       ▼
   Clerk (auth)        OpenAI / Anthropic         GitHub API (scoped
                       (via BYO key)              token / GitHub App)
        │                                               │
        ▼                                               ▼
   Railway Postgres                            Railway ↔ GitHub deploys
   (keys enc. at rest,                         → PR/preview env + prod
    admin settings, audit)                        redeploy on push
```

**Trust boundary:** everything privileged happens in the Node service. Secrets (provider keys, GitHub
token, admin code, Clerk secret) live only in Railway variables / encrypted DB — **never** shipped to
the client. Because the service is persistent, the agent has no execution-time limit.

---

## 7. The edit → publish flow (core UX)

1. Admin opens chat: *"Change the Total Projects card to a donut chart and move it above the sector
   tabs."*
2. `/api/edit` verifies admin, gathers relevant repo context (files + `dashboard_logic_guide.md`),
   calls the LLM to produce a **structured multi-file diff**. Runs to completion (no timeout).
3. Backend validates the diff (typecheck/build/lint), commits it to a new branch; Railway spins a
   **PR/preview environment**.
4. UI shows the admin: the **diff**, a plain-language summary, and a **live preview URL**.
5. Admin clicks **Publish** (or **Discard** / **Refine via chat**).
6. On Publish → merge to `main` → Railway **production** redeploy → everyone sees the change.
7. Entry written to the **audit log**; **Rollback** available (revert commit → redeploy).

**Guardrails:** validation must pass before Publish is enabled; agent limited to app source (deny-list
for CI/secrets/workflow files); every change is a reviewable diff; rate-limited; full audit trail;
one-click rollback.

---

## 8. Tech stack

- **Frontend:** existing Vite + React + TS + Tailwind, `@clerk/clerk-react`.
- **Backend:** **Node + Express (TypeScript)** on Railway — one persistent service; `@clerk/backend`
  for token verification; serves `dist/` + `/api/*`.
- **LLM:** provider abstraction over **OpenAI** (`openai`) and **Anthropic** (`@anthropic-ai/sdk`);
  BYO key. Default recommendation for code editing: a top Claude model; both supported.
- **VCS automation:** GitHub API via `octokit` with a fine-grained token or GitHub App.
- **Data:** **Railway Postgres** (`DATABASE_URL`) for encrypted keys, admin settings, audit log.
- **Infra/CLI:** Railway CLI for link, variables, Postgres service, deploys; Railway↔GitHub auto-deploy.

---

## 9. Security & safety (must-haves)

- S1. All secrets server-side only; provider keys **encrypted at rest**; never in the client bundle.
- S2. Admin verified on **every** privileged request (Clerk session + allowlist + admin code); no
  client-trusted role flags.
- S3. No public sign-up (Clerk restricted to allow-listed admins / invitation-only).
- S4. Agent runs with a **scoped** GitHub token (only this repo, contents + PRs); cannot touch other
  repos, CI secrets, or workflow files.
- S5. **Human-in-the-loop:** no production deploy without explicit admin Publish.
- S6. Validation gate (typecheck/build/lint) before Publish is allowed.
- S7. Prompt-injection defense: treat dashboard data/content as untrusted; the agent's tools are
  constrained (file edits within an allow-list, no arbitrary shell/network in the production path).
- S8. Rate limiting + spend caps on LLM and deploys.
- S9. Full audit log + one-click rollback.
- S10. Admin code stored hashed server-side; rotatable. (Current dev code was shared in chat — rotate
  before production.)

---

## 10. What I need from you (secrets/config)

Set via `railway variables` (or the Railway dashboard) — never committed:

1. **Clerk** — Publishable Key (`pk_…`, provided) and Secret Key (`sk_…`, provided). Configure Clerk to
   restrict sign-up to allow-listed admins.
2. **Admin allowlist** — `yureislysuarez@gmail.com` (provided).
3. **Admin code** — provided (`VDT-…`); stored hashed. Rotate before prod.
4. **GitHub access** — approval to create a **fine-grained PAT or GitHub App** scoped to this repo
   (contents + pull requests). You mint it; I never see your password.
5. **LLM key (for testing)** — one OpenAI or Anthropic key to validate end-to-end (deferred; prod uses
   the BYO key from Settings). **Don't paste in chat** — add via `railway variables`.
6. **Railway** — logged in ✓. Confirm **OI-1** (PR/preview environments on your plan).

---

## 11. Phases → tickets

Phases are **build milestones toward the full app** (not reduced-scope products). Each ticket lists
acceptance criteria (AC) and dependencies (dep).

### Phase 0 — Foundation & infrastructure
- **T0.1 Repo restructure.** Add `/server` (Node/Express TS). Frontend build → `dist/`; server serves
  `dist/` + `/api`. Root scripts: `build` (frontend), `start` (server). *AC:* `npm run build && npm
  start` serves the dashboard locally. *Dep:* —
- **T0.2 Railway project + service.** `railway init`/`link`; deploy the Node service; connect GitHub for
  auto-deploy on `main`. *AC:* dashboard loads on a Railway URL; push to `main` redeploys. *Dep:* T0.1
- **T0.3 Railway Postgres.** Add Postgres service; `DATABASE_URL` injected; migrations for `admin_keys`,
  `settings`, `audit_log`. *AC:* server reads/writes Postgres on Railway. *Dep:* T0.2
- **T0.4 Secret management.** Define variable schema; set via `railway variables`; `.env.example` +
  gitignored `.env.local` for local dev (done). *AC:* documented var list; no secrets in repo. *Dep:* T0.2
- **T0.5 Health + admin stub.** `/api/health` (200) and `verifyAdmin()` stub. *AC:* health OK; stub
  rejects non-admins. *Dep:* T0.1
- **T0.6 Retire Pages workflow.** Remove `.github/workflows/deploy.yml`; fix Vite base path for Railway;
  update README/CLAUDE.md. *AC:* no double-deploy; base path correct. *Dep:* T0.2

### Phase 1 — Authentication & admin gating
- **T1.1 Clerk integration (frontend).** `<ClerkProvider>`, admin sign-in, protected admin UI. *AC:* sign-in works local + Railway. *Dep:* T0.1
- **T1.2 Restrict sign-up.** Clerk allowlist/invitation-only. *AC:* non-allow-listed emails can't sign in. *Dep:* T1.1
- **T1.3 Backend admin verification.** `verifyAdmin()` = Clerk verify + email allowlist + admin-code (hashed). *AC:* privileged endpoints reject non-admins (tested). *Dep:* T0.5, T1.1
- **T1.4 Admin-code entry UX.** Modal → unlock admin mode; hashed compare server-side; rate-limited. *AC:* correct code unlocks editor; wrong code denied. *Dep:* T1.3

### Phase 2 — AI chat (conversational layer)
- **T2.1 Chat UI.** Admin-only chat panel (history, streaming, states). *AC:* renders for admins only. *Dep:* T1.4
- **T2.2 LLM proxy `/api/chat`.** Server-side streaming proxy; provider key from store; never exposed. *AC:* admin chats end-to-end; key not sent to client. *Dep:* T0.3, T1.3
- **T2.3 Provider abstraction + Settings.** OpenAI/Anthropic adapters; Settings UI to add/rotate BYO key (encrypted at rest). *AC:* switch providers via settings; key encrypted. *Dep:* T2.2
- **T2.4 Grounding context.** Feed parsed-data summary + `dashboard_logic_guide.md` so Q&A is accurate. *AC:* answers correct dashboard questions. *Dep:* T2.2

### Phase 3 — Code-editing agent
- **T3.1 Repo context retrieval.** Select relevant files/snippets as agent context per request. *AC:* relevant files chosen for sample requests. *Dep:* T2.2
- **T3.2 Diff generation `/api/edit`.** LLM → structured, validated multi-file diff (single long-running request). *AC:* valid diff for "change a graph / variable / layout". *Dep:* T3.1
- **T3.3 GitHub commit + preview env.** Commit diff to a branch via Octokit; Railway PR/preview deploy. *AC:* branch + preview URL returned. *Dep:* T3.2, T0.4, OI-1
- **T3.4 Validation gate.** Typecheck/build/lint the branch; block publish on failure. *AC:* broken change can't be published. *Dep:* T3.3
- **T3.5 Review & Publish UI.** Show diff + summary + preview; Publish / Discard / Refine. *AC:* Publish merges → production redeploy. *Dep:* T3.3, T3.4
- **T3.6 Audit log + rollback.** Record every change; one-click revert + redeploy. *AC:* audit lists entries; rollback restores prior prod. *Dep:* T0.3, T3.5
- **T3.7 Agent guardrails.** File allow-list; deny secrets/workflows/CI; rate limits; spend caps. *AC:* agent can't modify protected paths (tested). *Dep:* T3.2

### Phase 4 — Hardening & launch
- **T4.1 Security review.** Threat model incl. prompt injection; run `/security-review`. *AC:* no high-severity open issues. *Dep:* Phase 3
- **T4.2 Observability.** Logging, error surfaces, deploy/agent alerts. *AC:* failures visible. *Dep:* P3
- **T4.3 Rate limiting & abuse.** Enforce on chat/edit/publish. *AC:* limits verified. *Dep:* P3
- **T4.4 Tests.** Unit (verifyAdmin, provider adapters, diff apply) + e2e (auth → edit → publish → rollback). *AC:* CI green. *Dep:* P3
- **T4.5 Docs.** Admin runbook, architecture, env setup; update README/CLAUDE.md. *AC:* docs merged. *Dep:* P3
- **T4.6 Production launch.** Final vars, prod Clerk instance, rotate shared secrets, smoke test. *AC:* live end-to-end. *Dep:* T4.1–T4.5

---

## 12. Risks & mitigations

| Risk | Mitigation |
|------|-----------|
| AI ships broken code to prod | Validation gate + preview env + mandatory human Publish + rollback |
| Prompt injection via dashboard data | Untrusted-content handling; constrained agent tools; allow-listed paths |
| Leaked API keys | Server-side only, encrypted at rest, never in bundle; rotation |
| Unauthorized admin access | Double gate (allowlist + code) + server verification on every call |
| Runaway LLM/deploy spend | Rate limits + spend caps + audit |
| Single service = single point of failure | Railway healthchecks + rollback; keep the service stateless (state in Postgres) |

## 13. Success metrics
- Admin completes a graph/variable/layout change end-to-end without touching an IDE.
- 0 production deploys bypass the human Publish gate.
- 0 secrets present in the client bundle (verified).
- Every production change has an audit entry + working rollback.
