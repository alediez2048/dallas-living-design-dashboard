# Phased Implementation Plan: Perkins&Will ESG Dashboard

## Phase 1: Foundation & Setup
**Objective:** Establish the project structure, install dependencies, and define data models.
- [ ] **Scaffold Project:** Re-initialize Vite project with React + TypeScript.
- [ ] **Install Core Dependencies:** `recharts` (charts), `papaparse` (CSV), `lodash` (data manipulation), `lucide-react` (icons), `xlsx` (optional, if direct Excel support is desired later).
- [ ] **Styling Setup:** Initialize Tailwind CSS and define the custom color palette (Sleek dark mode/light mode themes).
- [ ] **Type Definitions:** Create `types.ts` to strictly define the `ProjectMetrics` interface and Petal structures as per the PRD.

## Phase 2: Data Engine (The "Brain")
**Objective:** accurately parse the complex spreadsheet structure into a usable format.
- [ ] **Parsing Logic:** Implement a robust parser to handle the multi-row header challenge (Row 5 target).
    - Detect key columns: Project Name, Sector, EUI metrics, Carbon metrics, etc.
    - Handle converting Excel/CSV row indices (start reading data at Row 9).
- [ ] **Data Transformation:** Create a "Mapper" utility to convert raw arrays into strictly typed `ProjectMetrics` objects.
    - Implement logic for binary checks ("Switch List Vetted" = Yes/No).
    - Calculate derived scores for the Petals.
- [ ] **Validation:** Write unit tests or manual verification scripts to ensure specific rows from the source file match the parsed output.

## Phase 3: UI Architecture & Layout
**Objective:** Create a premium, responsive application shell.
- [ ] **Shell Component:** Build `DashboardLayout` with a modern sidebar or top nav.
- [ ] **File Input:** Create a drag-and-drop zone or file picker to load the dataset (Client-sid only).
- [ ] **State Management:** Set up a React Context or simple state store to hold the parsed data and make it accessible to all components.

## Phase 4: Data Visualization Components
**Objective:** Build the individual charts that make up the dashboard.
- [ ] **Petal Radar Chart:** Build the central `PetalRadar` component using Recharts to visualize the 7+6 sub-categories.
- [ ] **Goal Trackers:** Create animated progress bars/rings for the "80% EUI Reduction" and "40% Water Reduction" goals.
- [ ] **Sector Comparisons:** Build the Bar Charts for comparing specific sectors against the Studio Average.

## Phase 5: Dashboard Assembly
**Objective:** Integrate components into the final views.
- [ ] **Overview Tab:** Assemble the "Petals" view (Radar + Headline Counters).
- [ ] **Sector Tab:** Implement the interactive filtering system to slice data by "Education", "Healthcare", etc.
- [ ] **Detail View:** Implement the `ProjectTable` with sorting and searching capabilities.

## Phase 6: Polish & "Wow" Factor
**Objective:** Ensure the application feels premium.
- [ ] **Aesthetics:** Apply glassmorphism effects, smooth gradients, and tasteful box shadows.
- [ ] **Interactivity:** Add hover effects to chart elements and smooth transitions between tabs.
- [ ] **Responsive Check:** Ensure layout works on smaller laptop screens (13").

## Phase 7: Deployment & Handoff
- [ ] **Build:** Run production build optimization.
- [ ] **Documentation:** Finalize README with specific instructions on how to structure the input CSV/Excel file for future use.
