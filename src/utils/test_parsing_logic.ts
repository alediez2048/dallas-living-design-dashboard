
// Mock the behavior of parser.ts without reading a file, just raw row processing
// specific to the user's reported "K12", "Higher Ed", "CCC" examples.

import { ProjectMetrics } from '../types';

// Mock Row indices based on parser.ts assumptions (we need to be sure these match what the parser finds)
// In parser.ts:
// nameIdx is found by "PROJECT NAME"
// projNumIdx is found by "PROJECT #"
// eligibleIdx is found by "Eligible for reporting?"

// A mock row structure. We'll use a simple array.
// But we need to know WHICH INDEX is which.
// Let's assume standard indices for this test based on a hypothetical file structure.
// IF the parser dynamically finds indices, we must mock that finding too or just test the logic functions.

// Since the Core Logic is inside the "iteration" loop using indices, let's extract the Logic or mock the whole process.
// Easier: Mock the RawData array that sheet_to_json produces.

// Mock Header Row (Row 6 / Index 5)
const headerRow = [
    "Year", "PROJECT #", "PROJECT NAME", "Phase", "Studio", "Sector", "Eligible for reporting?",
    "Resilience - 1~3", "Ecology", "Operational Carbon", "Embodied Carbon",
    "Switch List Vetted", "Air", "Light", "Thermal Comfort", "Acoustic Perform", "Water Quality", "Biophilia"
];

// Helper to find index
const getIdx = (name: string) => headerRow.findIndex(c => c.includes(name));

const nameIdx = getIdx("PROJECT NAME");
const projNumIdx = getIdx("PROJECT #");
const eligibleIdx = getIdx("Eligible"); // "Eligible for reporting?"

console.log(`Indices: Name=${nameIdx}, Proj#=${projNumIdx}, Eligible=${eligibleIdx}`);

// Mock Data Rows provided by User
const rows = [
    // Header (K12) - usually implied by content, but here we just test rows
    // User Example K12
    [2024, "143163", "Eaton HS (Last year reporting)", "CA", "Dallas", "K12", "YES"],
    [2024, "143155", "FWISD Worth Heights Replacement ES", "CD", "Dallas", "K12", "YES"],
    [2024, "143166", "Steele ECHS to Justin ES  (just starting)", "SD", "Dallas", "K12", "YES"],

    // Higher Ed
    [2024, "144086", "UTD Jindal School of Management III - Last year of reporting", "CA", "Dallas", "Higher Ed", "YES"],
    [2024, "144082", "UT Austin Business School - Last year of reporting", "CA", "Dallas", "Higher Ed", "YES"],
    [2024, "144089", "TCC Science Bldg Northeast Campus", "DD", "Dallas", "Higher Ed", "YES"],
    [2024, "144077", "ULL Health Care Education", "CA", "Dallas", "Higher Ed", "YES"],
    [2024, "144085", "Parker Univ. Conference Center (2026)", "SD", "Dallas", "Higher Ed", "NO"], // Should match NO
    [2024, "144087", "UNT HSC Design Standards", "Guideline", "Dallas", "Higher Ed", "NO"], // Should match NO

    // CCC
    [2024, "146115", "Aquarium and Attractions Complex (hold)", "Hold", "Dallas", "CCC", "YES"],
    [2024, "146121", "KBHCCD Expansion", "SD", "Dallas", "CCC", "YES"],
    [2024, "146110", "Design District (Once it comes off hold)", "Hold", "Dallas", "CCC", "YES"],
    [2024, "146122", "Harold Simmons Park Shade Structure - Last and only report/ EC Study", "Complete", "Dallas", "CCC", "YES"],
    [2024, "146123", "Dallas Museum of Art Renovation-AOR", "DD", "Dallas", "CCC", "YES"]
];

// Logic to test
const testLogic = () => {
    rows.forEach((row, i) => {
        const rawName = String(row[nameIdx] || '');
        const rawEligible = String(row[eligibleIdx]);

        // --- LOGIC FROM parser.ts (Updated) ---
        const isEligibleVal = rawEligible.toLowerCase().trim();
        const isEligible = isEligibleVal.startsWith('y') || isEligibleVal === 'x' || isEligibleVal.includes('eligible');

        console.log(`[${i}] Project: ${rawName.padEnd(40)} | RawEligible: "${rawEligible}" | Result: ${isEligible ? "ELIGIBLE" : "NOT ELIGIBLE"}`);
    });
};

testLogic();
