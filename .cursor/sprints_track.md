# Gastro Grid (caterCalcPro) — Sprint track: subscription plan feature parity

**Purpose:** Close the gap between **landing-page promises** (three tiers: Starter, Pro, AI) and **implemented product behavior**, using the same constraints as `.cursor/rules.md` and the workflow in `.cursor/agileSprintTrack_rules.md`.

**Constraints (non-negotiable):**

- Do not break existing routes.
- Do not refactor working core logic unless explicitly instructed.
- Do not modify existing database columns destructively.
- All new features must respect `organizationId` tenant isolation.
- All new premium features must be gated by `planTier`.
- Maintain backward compatibility.

**Sprint cadence:** 1 week per sprint (recommended). Workflow: Plan → Develop → Test → Review → Deploy → Document.

**Definition of done (per task):** Code merged; tests/verification for touched paths; no new TS errors; migrations verified if schema touched; feature gated correctly; production-safe.

---

## 0. Status — 2026-04-27 (sprint / board sync, revised)

**GitHub project “GastroGrid — Sprint Board” (latest user snapshot):** counts are **Backlog 3** · **Ready 1** · **In progress 1** · **Testing 11** · **Done 12**.

| Column | What’s on the board (summary) | Suggested next step |
| --- | --- | --- |
| **Done (12)** | Pro comparison endpoint/cards, prior-period empty state, unit tests, CSV/PDF/summary, named periods, period summary, QA for summary API/exports/calcs, etc. | Shipped baseline; the build under test should match or be traceable to this work. |
| **Testing (11)** | **QA:** date range handling; analytics dashboard; loading/empty; export file integrity; Starter vs Pro gating; comparison calculations — plus **Release — Validate production deployment for v1.0**; *four additional QA/release checks on the board* | Execute on **one** RC/staging build, checklist order; move each to **Done** with evidence. Close **Validate v1.0** when staging is signed off. |
| **In progress (1)** | **Release — Execute production smoke test** | Run the agreed smoke script on **production** after cutover; pass → **Done**; blockers → hotfix and repeat. |
| **Ready (1)** | **Release — Verify production deployment readiness** (pre–go-live checklist) | This fits **before** or **in parallel** with the smoke test: once readiness is satisfied, move to **Done**; **In progress** smoke remains the “last mile” on live. |
| **Backlog (3)** | **Feature** — event-to-event comparison **endpoint**; % change on comparison **cards**; comparison **trend** visualization | **Post–v1.0 / post-shipping** Pro analytics depth. Align with [§4.2 “Pro tier maturity”](#4b-pro-tier-maturity--short-checklist) and [§2](#2-gap-summary-prioritized--remaining); pull to **Ready** only after the release train clears **Testing** / **In progress** release work. |

**Flow sanity:** You dropped **pre-release** backlog noise: **Backlog** is only **future Pro analytics** features. **Release readiness** in **Ready** and **smoke** in **In progress** is a clear sequence — work **Readiness** first (deploy pipeline, config, rollbacks, monitoring), then finish **Testing (11)**, then complete **In progress** smoke. If any **Security/Performance** checks still exist on the board, fold them into **Testing** or **Readiness** so they are not lost.

**Next implementation (product roadmap, [§4](#4-next-implementation-ordered-backlog)):** **(1) P3/P7 landing + GST** — **shipped in copy (2026-04-27).** **Next: (2) P4** — Pro support contact on Billing/Help; **(3) P5–P6** — AI. *GitHub backlog features* (event-to-event, % on cards, trend viz) remain **Pro analytics depth** post–v1.0.

**Starter prep → inventory → shopping (product workflow):** Implementation lives in `server/routes/prepLists.ts` (scaled ingredients, `getInventory`, shortfall → `purchaseList`) and `PrepListGenerator` (**Shopping list** tab). When inventory covers all needs, the list is **empty** by design.

---

## 0b. Shipped / status — 2026-04-17 (historical)

### Shipped recently (high level)

- **P2 — Prior-period KPI comparison + summary CSV:** Equal-length window immediately before the resolved reporting range (`shared/analyticsPreviousPeriod.ts`, `resolvePreviousAnalyticsDateRange`); `AnalyticsPage` loads prior overview in parallel and shows signed deltas; **`GET /api/analytics/export/summary.csv`** (`analyticsSummaryExport.ts`) — KPIs + prior columns + cost-trend rows (non-GST).
- **Pro analytics (dashboard parity):** `AnalyticsPage` consumes overview, cost trends (line chart), top-cost events, recipes-in-period; loading/error/empty states; `recharts`.
- **Unified date range (Phase 2):** Single window for KPIs, trends, tables, and GST; server `resolveAnalyticsDateRangeFromQuery` + `analyticsDateRange.ts`; presets **30 / 90 / 180 / 365 / YTD / All / Custom**; URL sync via `ar` (+ `startDate`/`endDate` for custom) in `analyticsDateRangeClient.ts` + `AnalyticsDateRangeBar`.
- **Custom range picker UX (2026-04-17):** `AnalyticsDateRangeBar` uses `react-day-picker` **`captionLayout="dropdown"`** (scrollable month + year selects) with explicit **`startMonth` / `endMonth`** so very old ranges (e.g. multi-decade history) are reachable without arrow-only navigation.
- **GST reporting (Pro):** Summary API + Analytics section; **CSV + PDF** exports (`gstExportFormats.ts`, `gstReportingService.ts`) aligned with JSON payload.
- **Billing / plans:** Checkout session sync, register plan selection, billing page and related API paths (see `server/routes/billing.ts`, `RegisterPage`, `BillingPage`).
- **Landing (2026-04-27):** P3/P7 copy pass in `LandingPage.tsx` — Starter now states **per-line inventory GST (NZ)**; Pro states **Pro-only Analytics GST summary + exports**; disclaimers: management report, not IRD filing.

---

## 1. Audit — landing vs implementation (April 2026)

Sources: `src/pages/LandingPage.tsx` (feature cards + pricing bullets), `src/App.tsx` (routes + `RequirePlan`), `server/routes/*.ts`, key pages.

### Starter — “Available now”

| Promised (landing) | Implementation status | Notes |
| --- | --- | --- |
| Core costing and scaling | **Implemented** | Pricing engine (`server/services/pricingEngine.ts`), cost UI (`CostCalculator`, guest scaler, unit conversion). |
| Prep and shopping workflows | **Implemented** | `PrepListPage`, prep/shopping generators; not paywalled by plan in routing. |
| Recipe, menu, and event management | **Implemented** | Dedicated pages + API routes under `server/routes/`. |
| Inventory per-line GST (NZ) for stock pricing | **Implemented** | `InventoryPage` — all authenticated tiers; separate from Pro Analytics GST report. |

**Verdict:** Starter scope is largely **real product**, not placeholder.

---

### Pro — “Coming soon” (cards) / pricing bullets

| Promised (landing) | Implementation status | Notes |
| --- | --- | --- |
| Real-time cost analytics dashboard | **Implemented (core)** | `AnalyticsPage`: KPIs + cost/profit trend chart + top events + recipes; Pro-gated routes. “Real-time” = snapshot-derived when users create snapshots (not live WebSockets). |
| Margin reports | **Partial** | Margin visible via KPIs + trend; **prior-period KPI deltas** + **summary CSV** shipped; still no dedicated PDF “margin report” or chart-period overlay beyond KPI compare. |
| GST: consolidated business view (Pro) | **Implemented (Pro)** | **Analytics** `gst/summary` + CSV/PDF (`requirePlan("pro")`). **Landing (2026-04-27)** separates this from per-line **Inventory** GST (all tiers). |
| Priority email support | **Not in product** | Operational — see P4. |

**Verdict:** Pro **analytics + GST summary path** matches landing after the P3/P7 copy pass; **margin “report” product** and **support** (P4) remain.

---

### AI plan — “Future plan”

| Promised (landing) | Implementation status | Notes |
| --- | --- | --- |
| AI recipe generation | **Stub** | `POST /api/ai/generate-recipe` — swappable for real provider later. |
| AI menu suggestions | **Not implemented** | No route or UI. |
| Suggested cost and margin estimates | **Partial** | Same as normal costing post-create. |
| Auto-scaled ingredient quantities (feature card) | **Partial** | Placeholder quantities in `server/routes/ai.ts` (`"100"`). |

**Verdict:** AI tier remains **mostly placeholder** behind gating.

---

## 2. Gap summary (prioritized) — remaining

1. **Pro — Margin reports (P2 polish):** UI copy on snapshot prerequisites; optional **analytics summary PDF** if product wants parity with GST export format.
2. **Pro — GST vs marketing (P3/P7):** **Addressed in copy (2026-04-27):** `LandingPage` distinguishes per-line **Inventory** GST (Starter+) vs **Pro Analytics** GST summary/exports; not IRD/tax advice.
3. **Pro — Support (P4):** Priority support contact path (billing/help), honest expectations.
4. **AI — Provider + features (P5–P6):** Real LLM, menu suggestions, ingredient scaling, limits.
5. **Marketing & QA (P7):** **Landing tier bullets (partial):** GST scope aligned; remaining: badge polish, `RequirePlan` smoke, optional snapshot onboarding nudge.

---

## 3. Sprint backlog — plan feature parity

| Sprint | Theme | Status | Goal |
| --- | --- | --- | --- |
| **P1** | Pro analytics — UI parity | **Done (core)** | Dashboard: trends, tables, empty states — shipped. |
| **P2** | Pro — Margin & periods | **Done (core)** | Unified dates + custom picker + **prior-period KPI compare** + **summary CSV export** shipped; optional PDF / richer margin report still backlog if needed. |
| **P3** | Pro — GST / financial | **Done (copy + product path)** | GST summary + exports (Pro); **landing** aligned 2026-04-27 (Inventory GST vs Pro Analytics report). |
| **P4** | Pro — Support | **Not started** | Pro+ support contact; optional Stripe metadata. |
| **P5** | AI — Provider core | **Not started** | Real AI recipe generation. |
| **P6** | AI — Menu & scaling | **Not started** | Menu suggestions + quantity scaling. |
| **P7** | Alignment & hardening | **In progress (partial)** | Landing GST/tier copy done; gating smoke + nudges remain. |

---

## 4. Next implementation (ordered backlog)

Use this as the default pick list after each deploy. Reorder only with a deliberate scope change.

1. ~~**P3 / P7 — Landing + GST messaging**~~ — **Done (2026-04-27):** `LandingPage.tsx` — Starter/Pro GST scope, Pro Analytics vs Inventory, non-advice disclaimer.
2. **P4 — Priority support** — Mailto or form for Pro+ on Billing or Help; short SLA text; no fake automation.
3. **P5 — AI provider** — Env-based provider, validated JSON → recipe + ingredients, org usage limits, logging.
4. **P6 — Menu suggestions + scaling** — API + UI; replace hardcoded AI ingredient quantities on the production path.
5. **P7 — Final QA** — `RequirePlan` smoke (Starter / Pro / AI); optional in-app nudge to create **event snapshots** so analytics populates.

### 4b. Pro tier maturity — short checklist

Use this to track **Pro** specifically (not AI). Treat Pro as “mature vs landing” when **Remaining** is cleared or consciously descoped with copy updates.

**Done**

- [x] Pro analytics dashboard (KPIs, trends, tables, empty states) — P1
- [x] Unified reporting period + URL sync (`ar`, custom `startDate` / `endDate`) — P2
- [x] Custom range: month/year dropdowns + wide calendar bounds (`AnalyticsDateRangeBar`, `captionLayout="dropdown"`) — 2026-04-17
- [x] Prior-period KPI deltas + `GET /api/analytics/export/summary.csv` — P2 — 2026-04-17
- [x] GST summary in Analytics + CSV/PDF exports — P3 (reporting path)

**Remaining (recommended order)**

1. [x] **P3 + P7** — GST scope + `LandingPage` — **2026-04-27** (per-line **Inventory** GST = all tiers; consolidated **Analytics** GST summary/exports = Pro; disclaimers).
2. [ ] **P4** — Pro+ priority support contact (Billing/Help) + honest response-time copy
3. [ ] **P7** — `RequirePlan` smoke (Starter / Pro / AI); optional snapshot onboarding nudge
4. [ ] **P2 (optional)** — Analytics summary PDF if product wants symmetry with GST exports

**Nice-to-have (defer):** CI gate running `pnpm test`; inventory transaction audit trail.

**Tests (GitHub #14):** `pnpm test` / `pnpm test:watch` — Vitest + `shared/analyticsPreviousPeriod.test.ts` (requires `TZ=UTC`, set in npm script).

---

## 5. Per-sprint task checklist (maintenance)

### Sprint P1 — Pro analytics dashboard UI — **closed (core)**

- [x] Consume `GET /api/analytics/cost-trends` (React Query).
- [x] Consume `GET /api/analytics/top-cost-recipes` (React Query).
- [x] Visualize trends (`recharts`) with accessible patterns.
- [x] Empty states when no snapshots / no recipes.
- [ ] Periodic manual test: Pro vs Starter gating (keep in P7).

### Sprint P2 — Margin reports & periods — **closed (core)**

- [x] Report period: unified presets + custom + URL (`ar`) aligned with backend.
- [x] Margin trend from snapshots (chart + KPIs).
- [x] Custom range: month/year dropdown navigation + wide `startMonth`/`endMonth` (`AnalyticsDateRangeBar`).
- [x] Prior-period comparison (equal-length preceding window; KPI deltas on `AnalyticsPage`).
- [x] Optional analytics CSV export (non-GST): `GET /api/analytics/export/summary.csv`.

### Sprint P3 — Pro GST strategy — **closed (path + copy)**

- [x] Pro GST summary + exports (CSV/PDF) behind Pro routes.
- [x] Wording: **per-line inventory GST (Starter+)** vs **Pro Analytics** consolidated GST + exports; `LandingPage.tsx` updated 2026-04-27.

### Sprint P4 — Priority support

- [ ] Support email or form for Pro+; visible on Billing or Help.
- [ ] Document response expectations internally.

### Sprint P5 — AI provider

- [ ] Provider client + secrets via env.
- [ ] Replace placeholder loop in `server/routes/ai.ts` with generation + validation.
- [ ] Persist recipes with `isAIGenerated` / `aiPrompt` as today.

### Sprint P6 — AI menu + scaling

- [ ] Menu suggestion API + validation.
- [ ] UI: AI Studio or Menus integration.
- [ ] Ingredient quantities: remove hardcoded `"100"` for production AI path.

### Sprint P7 — Marketing & QA

- [x] Landing: Starter / Pro / **GST and tier bullets** vs shipped (2026-04-27). Optional: badge affordances when AI/Pro reach full parity.
- [ ] End-to-end smoke: Starter; Pro analytics; AI Studio (AI tier).

---

## 6. Risk register

| Risk | Mitigation |
| --- | --- |
| Analytics empty for new orgs | Onboarding copy + prompt to create events and snapshots (P7). |
| AI cost overruns | Rate limits, monthly caps, feature flag per org. |
| Scope creep | One theme per sprint; defer nice-to-have charts to backlog. |

---

## 7. References

- Plan gating: `src/lib/planTier.ts`, `server/middleware/plan.ts`, `src/components/RequirePlan.tsx`.
- Pro APIs: `server/routes/analytics.ts`, `server/services/analyticsService.ts`, `server/services/analyticsDateRange.ts`.
- Client range + URL: `src/lib/analyticsDateRangeClient.ts`, `src/lib/analyticsPreviousPeriodClient.ts`, `src/components/AnalyticsDateRangeBar.tsx`.
- Prior window helper: `shared/analyticsPreviousPeriod.ts`; summary CSV: `server/services/analyticsSummaryExport.ts`, route `GET /api/analytics/export/summary.csv`.
- GST: `server/services/gstReportingService.ts`, `server/services/gstExportFormats.ts`.
- AI stub: `server/routes/ai.ts`.
- Landing copy: `src/pages/LandingPage.tsx`.

**Document owner:** development team. **Last updated:** 2026-04-27.
