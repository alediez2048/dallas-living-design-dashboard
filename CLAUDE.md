# CLAUDE.md

Guidance for working in this repository.

## What this is

Dallas Living Design Dashboard — a client-side React SPA for Perkins&Will Dallas Studio.
It parses an Excel project-tracking spreadsheet in the browser and visualizes sustainability
and wellness ("Living Design") metrics across sectors and reporting years. No backend; all
parsing and computation happen client-side. Deployed to GitHub Pages on every push to `main`.

Live: https://alediez2048.github.io/dallas-living-design-dashboard/

## Commands

```bash
npm run dev       # Vite dev server at http://localhost:3000
npm run build     # tsc -b && vite build → dist/
npm run preview   # preview the production build
npm run lint      # eslint
```

Note: `tsc -b` can be slow on a cold cache in this environment. CI (`.github/workflows/deploy.yml`)
runs `npm ci && npm run build` on push to `main` and deploys `dist/` to GitHub Pages.

## Stack

React 18 + TypeScript, Vite, Tailwind CSS, Recharts (charts), Framer Motion (animation),
XLSX / PapaParse (file parsing), react-to-print (PDF report), lucide-react (icons).

## Architecture

Data flows: **Excel file → parser → ProjectMetrics[] → DataContext → components**.

- `src/utils/parser.ts` (~615 lines) — **the core data engine**. Reads the workbook, auto-detects
  the data sheet by scanning for a "PROJECT NAME" header (first 25 rows of each sheet), then maps
  columns by keyword against a main header row + sub-header row. Handles messy real-world spreadsheets:
  header-typo tolerance, multiple column-name variants (e.g. "Arch vs Int" / "Arch/Int"),
  sector detection/normalization, EUI guidance levels, energy-model flags. Each file is parsed with
  an explicit `reportingYear` argument (year is not read from the sheet).
- `src/types.ts` — `ProjectMetrics` is the central type. Grouped into `resilience` (EUI/carbon/water/
  ecology), `health` (switch list, air/light/thermal/acoustic/water/biophilia), and `designPerformance`
  (petal scores). Read this first before touching parser or metric cards.
- `src/context/DataContext.tsx` — holds parsed `projects`, parser `logs`, and year-filter state
  (`activeYears` / `availableYears`). Supports multi-file upload (one year per file) and a demo mode
  (`sampleDataGenerator.ts`). `ThemeContext.tsx` handles dark/light with persistence.
- `src/App.tsx` (~625 lines) — the entire dashboard view lives here: sector tabs, year compare filter,
  collapsible sections (DFW Projects Overview / Architecture / Interiors), the radar charts, and the
  project details table. Most metric-card filtering logic is inline here.
- `src/components/` — `MetricCard`, `PetalRadar`, `PetalsPerformanceRadar`, `GoalTracker`,
  `FileUploader`, `ProjectListModal`, `LegendModal`/`LegendView`, `LivingDesignFlower`,
  `DashboardLayout`. `Report/` (`FullReport`, `SectorReport`, `PrintMetricCard`) is the printable PDF.

## Domain concepts

- **Eligibility**: `Eligible for reporting?` → `Yes`/`Y`, `TBD`, `No 2026`, `No`/empty. Almost all
  metric-card numerators are scoped to **eligible** projects only. Preserve this when editing cards.
- **Arch vs Int**: projects split into `Architecture` / `Interiors` / `Unknown`. Architecture and
  Interiors have different metric sets (e.g. EUI 2030 goal is Architecture-only; LPD goal is Interiors-only).
- **Sectors** (tabs): K12, Higher ED, CCC, Healthcare DIV, Diversified Healthcare Interiors,
  Healthcare HCA, Workplace. Parser prefers a `Sector` column, falling back to name-based detection.
- **EUI Guidance Levels** 1–5 (National Avg → Excellent). **Goals**: 80% EUI reduction, 40% indoor
  water reduction, outdoor water, LPD 2030.

## Conventions & gotchas

- The Excel input format is documented in detail in `README.md` ("Excel File Structure Requirements").
  The sample source file is `LD Project Tracking - 2025 - Copy.xlsx` in the repo root.
- `parser.ts` has a header comment instructing that changes to parsing logic must also update
  `dashboard_logic_guide.md` (the human-readable source of truth for all parsing/metric logic) and
  the in-app legend `src/components/LegendModal.tsx`. Keep all three in sync when editing metric logic.
- In-app **"Debug Parser"** button (bottom-right) shows parser logs — the primary tool for diagnosing
  spreadsheets that don't import correctly.
- Metric filters are duplicated inline throughout `App.tsx` (e.g. `p.archVsInt === 'Architecture' &&
  p.isEligible && ...`). When changing a metric definition, grep for all occurrences — there is no
  single shared selector.

## Status

Feature-complete per `IMPLEMENTATION_PLAN.md` (all 7 phases checked off). Working tree is clean and
up to date with `origin/main`. Recent work: robust auto-detecting sheet/header finder, strict
eligibility scoping, multi-year YoY deltas + sparklines, Architecture/Interiors section split.
