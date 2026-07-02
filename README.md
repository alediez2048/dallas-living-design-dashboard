# Dallas Living Design Dashboard

🔗 **[Live Demo](https://alediez2048.github.io/dallas-living-design-dashboard/)**

A premium, interactive dashboard for visualizing and tracking Perkins&Will Dallas Studio's Living Design project metrics. This application parses Excel spreadsheets containing project data and displays comprehensive visualizations of sustainability and wellness metrics across different sectors.

> 📖 **How the numbers are calculated:** See **[dashboard_logic_guide.md](./dashboard_logic_guide.md)** — the source of truth for how spreadsheets are parsed and how every metric, sector, and goal is computed.

## Features

- 📊 **Interactive Petal Radar Chart**: Visualize 7+6 sub-categories of Living Design metrics
- 🎯 **Goal Tracking**: Monitor progress toward 80% EUI Reduction and 40% Water Reduction goals
- 🏢 **Sector Filtering**: Filter and analyze projects by sector (K12, Higher ED, CCC, Healthcare, Workplace, etc.)
- 📈 **Project Details Table**: Comprehensive table with sorting and filtering capabilities
- 🌓 **Dark/Light Mode**: Beautiful theme toggle with persistence
- 📱 **Responsive Design**: Works seamlessly on desktop and laptop screens
- 🎨 **Premium UI**: Glassmorphism effects, smooth animations, and modern design

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Installation

1. Clone or download this repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Development

Run the development server:
```bash
npm run dev
```

The application will open at `http://localhost:3000`

### Production Build

Build for production:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

The built files will be in the `dist/` directory, ready for deployment.

## Excel File Structure Requirements

The dashboard expects Excel files (`.xlsx` or `.xls`) with a specific structure. Follow these guidelines to ensure proper parsing:

> For the exact parsing rules and metric formulas (column detection, sector normalization, eligibility, goal calculations), see **[dashboard_logic_guide.md](./dashboard_logic_guide.md)**.

### Header Structure

- **Row 6 (Index 5)**: Main header row containing column names such as:
  - `PROJECT NAME`
  - `PROJECT #`
  - `Phase`
  - `Sector` (recommended - makes sector identification much easier)
  - `Eligible for reporting?`
  - `Operational Carbon`
  - `Embodied Carbon`
  - `Switch List Vetted`
  - `Air`, `Light`, `Thermal Comfort`, `Acoustic Perform`, `Water Quality`, `Biophilia`
  - `Ecology`
  - `Resilience - 1~3`

- **Row 7 (Index 6)**: Sub-header row containing detailed metrics:
  - `Predicted Net EUI`
  - `AIA Baseline EUI`
  - `Ttl Flow: Potable Water Use Reduction`
  - Other sub-metrics under main categories

### Data Rows

- **Row 9 onwards (Index 8+)**: Project data rows
- Each project row should have:
  - A valid Project Number (numeric, at least 4 characters)
  - A Project Name
  - **Sector value** (in the Sector column, if present)

### Sector Column (Recommended)

**The easiest way to specify sectors is to add a `Sector` column in Row 6 (main header row).**

The parser will:
1. **First priority**: Use the value from the `Sector` column for each project row
2. **Fallback**: If the Sector column is missing or empty, it will detect sectors from project names

**Supported sector values** (case-insensitive, partial matches supported):
- **K12**: "K12", "K-12", "School"
- **Higher ED**: "Higher ED", "Higher Education", "University", "College", "Campus"
- **CCC**: "CCC", "Civic", "Cultural", "Community", "Museum", "Library"
- **Healthcare DIV**: "Healthcare DIV", "Healthcare", "Health"
- **Diversified Healthcare Interiors**: "Diversified Healthcare Interiors", "Diversified", "Div" (when not part of "HCA")
- **Healthcare HCA**: "Healthcare HCA", "HCA"
- **Workplace**: "Workplace", "Corporate", "Commercial", "Office"

The parser normalizes these values automatically, so variations like "K-12", "K12", or "School" will all map to "K12" in the dashboard.

### Eligibility Status

The `Eligible for reporting?` column accepts:
- `Yes` or `Y` → Marked as eligible
- `TBD` → Status pending
- `No 2026` → Not eligible until 2026
- `No` or empty → Not eligible

### Key Metrics Columns

The parser looks for these specific column names (case-insensitive, partial matches):

**Resilience & Regeneration:**
- `Predicted Net EUI` (sub-header)
- `AIA Baseline EUI` (sub-header)
- `Operational Carbon` (main header)
- `Embodied Carbon` (main header)
- `Ttl Flow: Potable Water Use Reduction` (sub-header)
- `Ecology` (main header)
- `Resilience - 1~3` (main header)

**Health & Well-being:**
- `Switch List Vetted` (main header)
- `Air` (main header)
- `Light` (main header)
- `Thermal Comfort` (main header)
- `Acoustic Perform` (main header)
- `Water Quality` (main header)
- `Biophilia` (main header)

**General:**
- `Sector` (main header) - **Recommended**: Makes sector identification much easier and more accurate

### Example File Structure

```
Row 1-5: [Metadata/Title rows - ignored]
Row 6:    [PROJECT NAME | PROJECT # | Phase | Eligible for reporting? | Operational Carbon | ...]
Row 7:    [           |           |       |                        | Predicted Net EUI | ...]
Row 8:    [Empty or separator row]
Row 9+:   [Project data rows]
```

## Usage

1. **Upload Excel File**: 
   - Click the upload area or drag and drop your Excel file
   - Supported formats: `.xlsx`, `.xls`, `.csv`

2. **View Dashboard**:
   - The dashboard automatically loads and displays all projects
   - Use sector tabs to filter by specific sectors
   - Hover over chart elements for detailed tooltips

3. **Navigate**:
   - Use the sidebar to switch between views (currently Overview is active)
   - Click "Reset Data" to clear the current dataset and upload a new file

4. **Debug Mode**:
   - Click the "Debug Parser" button in the bottom-right corner
   - View detailed parsing logs to troubleshoot file structure issues

## Project Structure

```
src/
├── components/          # React components
│   ├── DashboardLayout.tsx
│   ├── FileUploader.tsx
│   ├── GoalTracker.tsx
│   ├── PetalRadar.tsx
│   └── ThemeToggle.tsx
├── context/            # React Context providers
│   ├── DataContext.tsx
│   └── ThemeContext.tsx
├── utils/              # Utility functions
│   ├── parser.ts       # Excel parsing logic
│   └── test_parsing_logic.ts
├── types.ts            # TypeScript type definitions
├── App.tsx             # Main application component
└── main.tsx            # Application entry point
```

## Technologies Used

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Recharts** - Data visualization
- **Framer Motion** - Animations
- **XLSX** - Excel file parsing
- **Lucide React** - Icons

## Troubleshooting

### File Not Parsing Correctly

1. **Check File Structure**: Ensure your Excel file follows the structure outlined above
2. **Enable Debug Mode**: Click "Debug Parser" to see detailed parsing logs
3. **Verify Headers**: Make sure Row 6 and Row 7 contain the expected column names
4. **Check Sector Detection**: If sectors aren't detected, ensure sector names match the supported patterns

### Build Warnings

The build may show warnings about chunk sizes. This is normal for applications with chart libraries. The build is optimized with code splitting to minimize load times.

### Performance

- Large files (1000+ projects) may take a few seconds to parse
- The table displays up to 100 projects at a time for performance
- All data processing happens client-side (no server required)

## Deployment

This project is automatically deployed to GitHub Pages via GitHub Actions.

### Automated Deployment

Every push to the `main` branch triggers an automated deployment workflow:
1. Code is checked out
2. Dependencies are installed
3. Production build is created
4. Build artifacts are deployed to GitHub Pages

View the live site at: **https://alediez2048.github.io/dallas-living-design-dashboard/**

### Manual Deployment to Other Platforms

The `dist/` folder contains the production build. You can also deploy to:

- **Vercel**: `vercel deploy`
- **Netlify**: Drag and drop the `dist/` folder
- **AWS S3**: Upload `dist/` contents to an S3 bucket with static hosting enabled

## License

This project is proprietary software for Perkins&Will Dallas Studio.

## Support

For issues or questions about file structure requirements, refer to the "Excel File Structure Requirements" section above or check the debug parser logs for detailed information about what the parser is detecting.
