# Dashboard Logic Guide

**Source of truth for how the Dallas Living Design Dashboard parses spreadsheets and computes every
metric.** This is the human-readable companion to the code.

> ⚠️ **Keep three files in sync.** If you change parsing or metric logic in
> `src/utils/parser.ts`, you must also update:
> 1. This file (`dashboard_logic_guide.md`)
> 2. The in-app legend `src/components/LegendModal.tsx`
> 3. `README.md` ("Excel File Structure Requirements") if the input format changes
>
> All calculations below are implemented in `src/utils/parser.ts`. Line references are approximate.

---

## 1. File & sheet detection

- The file is read client-side as a binary string via `FileReader` and parsed with `XLSX.read`.
- **Sheet auto-detection**: every sheet is scanned (first 25 rows) for a cell containing the text
  `"project name"` (case-insensitive). The first sheet that matches becomes the data sheet, and the
  matching row becomes the **main header row** (`headerIdx`).
- **Fallback**: if no `"PROJECT NAME"` header is found anywhere, the parser falls back to the first
  sheet with `headerIdx = 1` (row 2) and logs a warning.

### Header row model

Three header rows are read relative to the detected `headerIdx`:

| Row | Variable | Contains |
|-----|----------|----------|
| `headerIdx − 1` | `superHeaderRow` | Petal / design-driver group titles (e.g. "POETICS & BEAUTY") |
| `headerIdx` | `mainHeaderRow` | Primary column names (Project Name, Sector, Operational Carbon…) |
| `headerIdx + 1` | `subHeaderRow` | Sub-metric names (Predicted Net EUI, AIA Baseline EUI…) |

**Data rows start at `headerIdx + 2`** and continue to the end of the sheet.

### Column mapping

Columns are located by **case-insensitive substring match** (`findColIndex`) against a header row.
Many columns try several header-name variants and fall back between the main and sub header rows.
Key columns and where they're searched:

- **General** (main header): `PROJECT NAME`, `PROJECT #`, `Eligible for reporting?`, `Phase`, `Sector`.
- **Arch vs Int** (main, then sub): `Arch vs Int`, `Arch/Int`, `Arch or Int`, `Architecture vs Int`,
  `A vs I`, `Arch v Int`.
- **EUI** (sub header): `Predicted Net EUI`, `AIA Baseline EUI`.
- **Carbon** (main): `Operational Carbon`, `Embodied Carbon`.
- **Water** (sub/main): `Ttl Flow: Potable Water Use Reduction` (indoor), `Outdoor Water`.
- **LPD** (main/sub): `LPD`, `Lighting Power Density`.
- **EUI Guidance** (main/sub): `Level EUI Guidance`, `EUI Level`, `EUI Guidance`.
- **Energy Model** (sub/main): `Energy Model`, `Energy Modeled`.
- **Ecology / Resilience scores** (main): `Ecology`, `Resilience - 1~3`.
- **Health** (main): `Switch List Vetted`, `Air`, `Light`, `Thermal Comfort`, `Acoustic Perform`,
  `Water Quality`, `Biophilia`.
- **Petals** (super header): `POETICS & BEAUTY`, `CONCEPTUAL CLARITY`, `RESEARCH & INNOVATION`,
  `TECHNOLOGY & TECTONICS`, `COMMUNITY & INCLUSION`, `RESILIENCE & REGENERATION`, `HEALTH & WELL-BEING`.

If a column isn't found its index is `-1` and dependent metrics degrade gracefully (usually to `0`,
`null`, `"N/A"`, or `"Unknown"`). All detections are written to the parser log (visible via the in-app
**Debug Parser** button).

---

## 2. Row classification

For each data row the parser decides whether it is a **project row** or a **sector divider**:

- **Project row** requires *both*: the `PROJECT #` cell starts with a digit and is ≥ 4 characters long,
  **and** the `PROJECT NAME` cell is non-empty.
- **Sector divider**: a non-project row whose Name, Project #, or column-0 text is recognized as a
  sector (see `detectSector`). It updates the running `currentSector` used for subsequent rows and is
  not emitted as a project.
- Any other non-project row is ignored (and logged).

---

## 3. Sector assignment

Priority order per project:

1. **Sector column** — if a `Sector` column exists and the cell is non-empty, its value is normalized
   via `normalizeSector`.
2. **Name detection** — otherwise `detectSector` inspects the project name.
3. **Running sector** — otherwise the project inherits the last sector-divider header seen above it.

### Recognized sectors (canonical names)

`K12`, `Higher ED`, `CCC`, `Healthcare DIV`, `Diversified Healthcare Interiors`, `Healthcare HCA`,
`Workplace`. (`Science & Tech` is detectable to prevent row carry-over errors but is not a dashboard tab.)

### Normalization rules (case-insensitive)

- **K12**: `K12`, `K-12`, `School`
- **Higher ED**: `Higher ED/Education`, `University`, `College`, `Campus`, `Academic`, plus common
  typos (`Hiehger`, `Hieghger`, `Hihger`)
- **CCC**: `CCC`, `Civic`, `Cultural`, `Community`, `Museum`, `Library`, `Public`
- **Healthcare** (order matters — most specific first):
  - `Diversified Healthcare` / `Healthcare Diversified` / bare `Diversified` → **Diversified Healthcare Interiors**
  - `Healthcare HCA` / `HCA Healthcare` / bare `HCA` → **Healthcare HCA**
  - `Healthcare DIV` / `DIV Healthcare` → **Healthcare DIV**
  - Any remaining `Healthcare` / `Health` → **Healthcare DIV** (generic fallback)
- **Workplace**: `Workplace`, `Corporate`, `Commercial`, `Office`, `Studio` (and `Interiors` in
  `normalizeSector` only)

> The ordering is deliberate: multi-word phrases are tested before single keywords so that, e.g.,
> "Diversified Healthcare" is not prematurely captured by the generic "Healthcare" rule.

---

## 4. Architecture vs Interiors

Read from the **Arch vs Int** column and normalized:

- `A` or `Architecture` → **Architecture**
- `I` or `Interiors` → **Interiors**
- Any other / missing value → the raw string, or **Unknown**

Architecture and Interiors surface different metric sets in the UI (see §7). If this column is missing
every project becomes `Unknown` and the Architecture/Interiors overview panels are empty.

---

## 5. Eligibility

From the `Eligible for reporting?` column (`eligibilityStatus`, case-insensitive):

| Cell value | Status | `isEligible` |
|------------|--------|:---:|
| starts with `y` or contains `yes` | `Yes` | **true** |
| contains `tbd` | `TBD` | false |
| contains `2026` | `No 2026` | false |
| anything else / empty | `No` | false |

**`isEligible` is true only when status === `Yes`.** Nearly every metric-card numerator on the
dashboard is scoped to eligible projects only — preserve this when editing.

---

## 6. Metric calculations

### The Priority Rule (explicit column beats calculation)

For goal metrics, an **explicit Yes/No column**, when present, overrides the calculated value.
Detection reads the first character: `y…` → true, `n…` → false; if no explicit column exists, the
calculation fallback is used.

| Metric | Explicit column(s) searched | Calculation fallback |
|--------|------------------------------|----------------------|
| **Meets 2030 EUI Goal** | `Meet 2030`, `2030 Goal` | `euiReduction ≥ 0.80` |
| **Meets Indoor Water Goal** | `Meets indoor Water Commitment`, `Indoor Water Commitment`, `Water Commitment`, `Meets Water Goal` | `indoorWaterReduction ≥ 0.40` |
| **Meets Outdoor Water Goal** | `Meets PW Outdoor Water Commitment`, `Outdoor Water Commitment`, `PW Outdoor Water Commitment` | `outdoorWaterReduction > 0.50` |
| **Meets 2030 LPD Goal** | `Meet 2030 LPD`, `2030 LPD Goal` | `lpdReduction ≥ 0.25` |

### EUI reduction

```
euiReduction = (baselineEui − predictedEui) / baselineEui   // only if baselineEui > 0 AND predicted present
```

**Missing-data guard:** an empty Predicted Net EUI cell yields `euiReduction = 0` (missing), **not**
100% reduction. Numbers are parsed leniently — `getNumber` strips `%` and parses; non-numeric → `0`.

### Water / LPD reductions

- `indoorWaterReduction` = parsed value of `Ttl Flow: Potable Water Use Reduction` (a decimal, e.g.
  `0.45` = 45%).
- `outdoorWaterReduction` = parsed `Outdoor Water` value, or `null` if the column is absent.
- `lpdReduction` = parsed `LPD` value, or `null` if absent.

### Embodied Carbon (tracking)

`embodiedCarbonPathway` = raw `Embodied Carbon` cell (default `"TBD"`). A project counts as
**tracking embodied carbon** in the UI when the pathway is **not** `N/A`, `TBD`, or `no`
(case-insensitive).

### Energy Model

`Yes`/`Y`/`True`/`1` → **Yes**; `No`/`N`/`False`/`0` → **No**; empty or anything else → **N/A**.
Column absent → **N/A**.

### EUI Guidance Level

Integer **1–5** from the EUI Guidance column; any value outside 1–5, non-numeric, or empty → `null`.
Levels map to labels in the UI: 1 National Avg, 2 Business as Usual, 3 Baseline, 4 Good, 5 Excellent.

### Switch List Vetted

`true` when the `Switch List Vetted` cell (lowercased) starts with `y`.

### Scores

- **Ecology / Resilience / Health sub-scores** use `getScore`: a number is taken as-is; any non-empty
  value (e.g. `"X"`, `"Yes"`) counts as `1`; empty → `0`. *(Simplified; revisit if the sheet encodes
  actual counts.)*
- **Petal / design-driver scores** (`designPerformance`) are normalized fractions:
  `score = getScore(cell) / total`, where `total` is parsed from the leading number of the group
  header (e.g. `"4 Total Questions"` → 4; defaults: most petals 4, Community 6). Empty cell → `null`.

---

## 7. Reporting year & multi-file model

- The reporting year is **not** read from the spreadsheet. `parseProjectData(file, reportingYear)`
  receives it as an argument; the uploader assigns one year per file.
- `DataContext` merges projects from all uploaded files and derives `availableYears` from the set of
  `reportingYear` values. The UI supports comparing multiple years side-by-side.

---

## 8. UI scoping notes (where these values are consumed)

Implemented in `src/App.tsx`:

- **DFW Projects Overview**: total & eligible counts for the current sector/year filter.
- **Architecture panel** (hidden on the Workplace and Diversified Healthcare Interiors tabs): totals,
  Energy Modeled Yes/No/N/A, and — scoped to `archVsInt === 'Architecture' && isEligible` — Meeting
  2030 EUI, Indoor Water, Outdoor Water, Switch List Vetted, Tracking Embodied Carbon, plus EUI
  Guidance Level distribution (Levels 1–5, computed against the latest year when comparing years).
- **Interiors panel** (shown only when Interiors projects exist): totals plus — scoped to
  `archVsInt === 'Interiors' && isEligible` — Meeting LPD 2030, Indoor Water, Tracking Embodied
  Carbon, Switch List Vetted.
- **Radar charts** (`PetalRadar`, `PetalsPerformanceRadar`) use eligible projects only.

> Metric filter predicates are duplicated inline throughout `App.tsx` (there is no shared selector).
> When you change a metric's definition here, grep `App.tsx` for every occurrence and update them all,
> plus the corresponding entry in `LegendModal.tsx`.
