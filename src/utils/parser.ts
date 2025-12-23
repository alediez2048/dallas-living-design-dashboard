import { ProjectMetrics } from '../types';
import * as XLSX from 'xlsx';

// Define the structure of the raw Excel data
type RawRow = (string | number | null)[];

/**
 * Parses the raw Excel file buffer into structured ProjectMetrics objects.
 * Handles the specific multi-row header format of the Dallas Living Design Dashboard.
 */
export const parseProjectData = async (file: File): Promise<ProjectMetrics[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];

                // Convert to JSON array of arrays (treating all cells as raw values)
                const rawData = XLSX.utils.sheet_to_json<RawRow>(worksheet, { header: 1, defval: null });

                // Identify Header Rows
                // Row 6 (Index 5): Main Headers ("PROJECT NAME", "Phase", "Switch List Vetted")
                // Row 7 (Index 6): Sub Headers ("Predicted Net EUI", "% of reduction")
                const mainHeaderRow = rawData[5];
                const subHeaderRow = rawData[6];

                if (!mainHeaderRow || !subHeaderRow) {
                    reject(new Error("Could not find header rows (Row 6 and 7) in the Excel file."));
                    return;
                }

                // --- Column Mapping Helper ---
                // We find the index of a column by searching for a keyword in the header rows.
                const findColIndex = (row: RawRow, keyword: string): number => {
                    return row.findIndex((cell) =>
                        typeof cell === 'string' && cell.toLowerCase().includes(keyword.toLowerCase())
                    );
                };

                // --- Map Critical Columns ---
                // General
                const nameIdx = findColIndex(mainHeaderRow, "PROJECT NAME");
                const eligibleIdx = findColIndex(mainHeaderRow, "Eligible for reporting?");
                const phaseIdx = findColIndex(mainHeaderRow, "Phase");

                // --- Resilience & Regeneration ---
                // EUI: Look for "Predicted Net EUI" in sub-header row (Row 7)
                // Note: The EUI section in Row 6 is "Operational Energy..."
                const predictedEuiIdx = findColIndex(subHeaderRow, "Predicted Net EUI");
                const baselineEuiIdx = findColIndex(subHeaderRow, "AIA Baseline EUI");

                // Carbon
                // "Operational Carbon" is in Row 6
                const opCarbonIdx = findColIndex(mainHeaderRow, "Operational Carbon");
                // "Embodied Carbon" is in Row 6
                const embodiedCarbonIdx = findColIndex(mainHeaderRow, "Embodied Carbon");

                // Water
                // "Water - Indoor" is in Row 6
                // "Ttl Flow: Potable Water Use Reduction" is in Row 7 under that section
                const indWaterRedIdx = findColIndex(subHeaderRow, "Ttl Flow: Potable Water Use Reduction");

                // Ecology & Resilience Scores (Row 6)
                const ecologyIdx = findColIndex(mainHeaderRow, "Ecology");
                const resilienceIdx = findColIndex(mainHeaderRow, "Resilience - 1~3");

                // --- Health & Well-being (Row 6) ---
                const switchListIdx = findColIndex(mainHeaderRow, "Switch List Vetted");
                const airIdx = findColIndex(mainHeaderRow, "Air");
                const lightIdx = findColIndex(mainHeaderRow, "Light"); // "Light - 2 Total Questions"
                const thermalIdx = findColIndex(mainHeaderRow, "Thermal Comfort");
                const acousticIdx = findColIndex(mainHeaderRow, "Acoustic Perform");
                const waterQualityIdx = findColIndex(mainHeaderRow, "Water Quality");
                const biophiliaIdx = findColIndex(mainHeaderRow, "Biophilia");


                const parsedProjects: ProjectMetrics[] = [];
                let currentSector = "Unknown Sector";

                // --- Iterate Data Rows (Starting from Row 9 / Index 8) ---
                for (let i = 8; i < rawData.length; i++) {
                    const row = rawData[i];

                    // Skip empty rows
                    if (!row || row.length === 0) continue;

                    const rawName = row[nameIdx];

                    // 1. Check for Sector Headers
                    // Sector headers usually have the sector name in the first couple of columns or the Name column
                    // Pattern: "EDUCATION (16 projects...)"
                    if (typeof rawName === 'string' && (rawName.includes("EDUCATION") || rawName.includes("HEALTHCARE") || rawName.includes("COMMERCIAL") || rawName.includes("SCIENCE"))) {
                        // Clean up sector name (remove parenthesis portion)
                        currentSector = rawName.split("(")[0].trim();
                        continue; // Skip this row, it's just a header
                    }

                    // 2. Filter valid projects
                    // Must have a name and not be a sub-header row
                    if (!rawName || rawName === "PROJECT NAME") continue;


                    // --- Extract Metrics ---

                    // Helper to get diverse number formats (handles "12%", 0.12, "TBD", etc)
                    const getNumber = (val: any): number => {
                        if (typeof val === 'number') return val;
                        if (typeof val === 'string') {
                            // Remove % and parse
                            const clean = val.replace(/%/g, '').trim();
                            const parsed = parseFloat(clean);
                            return isNaN(parsed) ? 0 : parsed;
                        }
                        return 0;
                    };

                    // Helper for scores (often "X" or a number)
                    // Adjust logic based on how scores are actually entered (e.g. is it a count? or a simple check?)
                    // For now assuming number or simple existence checks
                    const getScore = (val: any): number => {
                        if (typeof val === 'number') return val;
                        if (val) return 1; // If cell has content like "Yes" or "X", count as score (simplify for now)
                        return 0;
                    };


                    // EUI Calculation
                    const predictedEui = getNumber(row[predictedEuiIdx]);
                    const baselineEui = getNumber(row[baselineEuiIdx]);
                    // Calculate reduction if both exist, else 0
                    let euiReduction = 0;
                    if (baselineEui > 0) {
                        euiReduction = (baselineEui - predictedEui) / baselineEui;
                    }

                    // Water Reduction
                    // Often already a percentage in the sheet? Let's assume decimal or %
                    const waterReduction = getNumber(row[indWaterRedIdx]); // If it's 0.45 it means 45%


                    const project: ProjectMetrics = {
                        id: `proj-${i}`,
                        name: String(rawName),
                        sector: currentSector,
                        isEligible: String(row[eligibleIdx]).toLowerCase().includes('yes') || String(row[eligibleIdx]).toLowerCase().includes('eligible'),
                        phase: String(row[phaseIdx] || "Unknown"),

                        resilience: {
                            euiReduction: euiReduction,
                            meets2030Goal: euiReduction >= 0.80,
                            operationalCarbonReduction: getNumber(row[opCarbonIdx]), // Placeholder if column exists
                            embodiedCarbonPathway: String(row[embodiedCarbonIdx] || "TBD"),
                            indoorWaterReduction: waterReduction,
                            meetsWaterGoal: waterReduction >= 0.40,
                            ecologyScore: getScore(row[ecologyIdx]),
                            resilienceScore: getScore(row[resilienceIdx]),
                        },

                        health: {
                            switchListVetted: String(row[switchListIdx]).toLowerCase().startsWith('y'),
                            airScore: getScore(row[airIdx]),
                            lightScore: getScore(row[lightIdx]),
                            thermalComfortScore: getScore(row[thermalIdx]),
                            acousticScore: getScore(row[acousticIdx]),
                            waterQualityScore: getScore(row[waterQualityIdx]),
                            biophiliaScore: getScore(row[biophiliaIdx]),
                        },
                    };

                    parsedProjects.push(project);
                }

                resolve(parsedProjects);

            } catch (err) {
                reject(err);
            }
        };

        reader.onerror = (err) => reject(err);
        reader.readAsBinaryString(file);
    });
};
