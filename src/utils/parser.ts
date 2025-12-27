import { ProjectMetrics } from '../types';
import * as XLSX from 'xlsx';

// Define the structure of the raw Excel data
type RawRow = (string | number | null)[];

/**
 * Parses the raw Excel file buffer into structured ProjectMetrics objects.
 * Handles the specific multi-row header format of the Dallas Living Design Dashboard.
 *
 * IMPORTANT: If you modify logic here (column detection, metric calculations, priority rules),
 * you MUST update:
 * 1. The Logic Guide: dashboard_logic_guide.md
 * 2. The UI Legend: src/components/LegendModal.tsx
 */
export const parseProjectData = (file: File): Promise<{ projects: ProjectMetrics[], logs: string[] }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        const logs: string[] = [];
        logs.push(`Parsing file: ${file.name}`);

        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];

                // Convert to JSON array of arrays (treating all cells as raw values)
                const rawData = XLSX.utils.sheet_to_json<RawRow>(worksheet, { header: 1, defval: null });
                logs.push(`Sheet found: ${firstSheetName}, total rows: ${rawData.length}`);

                // Identify Header Rows
                // Row 2 (Index 1): Main Headers ("PROJECT NAME", "Phase", "Switch List Vetted")
                // Row 3 (Index 2): Sub Headers ("Predicted Net EUI", "% of reduction")
                const mainHeaderRow = rawData[1];
                const subHeaderRow = rawData[2];

                if (!mainHeaderRow || !subHeaderRow) {
                    reject(new Error("Could not find header rows (Row 2 and 3) in the Excel file."));
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
                const projNumIdx = findColIndex(mainHeaderRow, "PROJECT #");
                const eligibleIdx = findColIndex(mainHeaderRow, "Eligible for reporting?");
                const phaseIdx = findColIndex(mainHeaderRow, "Phase");
                const archIntIdx = findColIndex(mainHeaderRow, "Arch vs Int");
                const sectorIdx = findColIndex(mainHeaderRow, "Sector");

                logs.push(`Column Mapping: Name=${nameIdx}, Proj#=${projNumIdx}, Eligible=${eligibleIdx}, Sector=${sectorIdx}`);
                if (nameIdx === -1 || projNumIdx === -1) {
                    logs.push("CRITICAL WARNING: Name or Project Number column not found!");
                }
                if (sectorIdx === -1) {
                    logs.push("WARNING: Sector column not found. Will use fallback detection from project names.");
                }

                // --- Resilience & Regeneration ---
                // EUI: Look for "Predicted Net EUI" in sub-header row (Row 3)
                // Note: The EUI section in Row 2 is "Operational Energy..."
                const predictedEuiIdx = findColIndex(subHeaderRow, "Predicted Net EUI");
                const baselineEuiIdx = findColIndex(subHeaderRow, "AIA Baseline EUI");

                // Carbon
                // "Operational Carbon" is in Row 2
                const opCarbonIdx = findColIndex(mainHeaderRow, "Operational Carbon");
                // "Embodied Carbon" is in Row 2
                const embodiedCarbonIdx = findColIndex(mainHeaderRow, "Embodied Carbon");

                // Water
                // "Water - Indoor" is in Row 2
                // "Ttl Flow: Potable Water Use Reduction" is in Row 3 under that section
                // "Ttl Flow: Potable Water Use Reduction" is in Row 3 under that section
                const indWaterRedIdx = findColIndex(subHeaderRow, "Ttl Flow: Potable Water Use Reduction");

                // Search for Outdoor Water column (generic search)
                // "PW Outdoor Water" or similar
                let outWaterRedIdx = findColIndex(mainHeaderRow, "Outdoor Water");
                if (outWaterRedIdx === -1) outWaterRedIdx = findColIndex(subHeaderRow, "Outdoor Water");

                // LPD
                // "LPD 2030 Goal" or similar
                let lpdIdx = findColIndex(mainHeaderRow, "LPD");
                if (lpdIdx === -1) lpdIdx = findColIndex(subHeaderRow, "LPD");
                if (lpdIdx === -1) lpdIdx = findColIndex(mainHeaderRow, "Lighting Power Density");

                if (outWaterRedIdx !== -1) logs.push(`Found Outdoor Water Column at index ${outWaterRedIdx}`);
                else logs.push("Outdoor Water Column NOT found");

                if (lpdIdx !== -1) logs.push(`Found LPD Column at index ${lpdIdx}`);
                else logs.push("LPD Column NOT found");

                // Ecology & Resilience Scores (Row 2)
                const ecologyIdx = findColIndex(mainHeaderRow, "Ecology");
                const resilienceIdx = findColIndex(mainHeaderRow, "Resilience - 1~3");

                // --- Health & Well-being (Row 2) ---
                const switchListIdx = findColIndex(mainHeaderRow, "Switch List Vetted");
                const airIdx = findColIndex(mainHeaderRow, "Air");
                const lightIdx = findColIndex(mainHeaderRow, "Light"); // "Light - 2 Total Questions"
                const thermalIdx = findColIndex(mainHeaderRow, "Thermal Comfort");
                const acousticIdx = findColIndex(mainHeaderRow, "Acoustic Perform");
                const waterQualityIdx = findColIndex(mainHeaderRow, "Water Quality");
                const biophiliaIdx = findColIndex(mainHeaderRow, "Biophilia");


                const parsedProjects: ProjectMetrics[] = [];
                let currentSector = "Unknown Sector";

                // --- Iterate Data Rows (Starting from Row 6 / Index 5) ---
                for (let i = 5; i < rawData.length; i++) {
                    const row = rawData[i];

                    // Skip empty rows
                    if (!row || row.length === 0) continue;

                    // CHECK SECTOR: Check Name, Project #, and Column 0 for Sector headers
                    // The Excel file often puts sector headers in the first columns
                    const markerA = String(row[nameIdx] || "").trim().toUpperCase();
                    const markerB = String(row[projNumIdx] || "").trim().toUpperCase();
                    const markerC = String(row[0] || "").trim().toUpperCase();

                    // Helper to normalize sector name to match expected format
                    const normalizeSector = (str: string): string => {
                        if (!str) return "Unknown Sector";
                        const s = str.trim().toUpperCase();

                        // Direct matches first (most specific)
                        if (s === "K12" || s === "K-12") return "K12";
                        if (s === "HIGHER ED" || s === "HIGHER EDUCATION" || s === "HIGHER EDU" || s === "HIEHGER ED") return "Higher ED";  // Handle typo "Hiehger ED"
                        if (s === "CCC" || s === "CIVIC" || s === "CULTURAL" || s === "COMMUNITY") return "CCC";
                        if (s === "WORKPLACE" || s === "CORPORATE" || s === "COMMERCIAL" || s === "OFFICE") return "Workplace";
                        if (s === "DIVERSIFIED HEALTHCARE INTERIORS" || s === "DIVERSIFIED") return "Diversified Healthcare Interiors";
                        if (s === "HEALTHCARE HCA" || s === "HCA") return "Healthcare HCA";
                        if (s === "HEALTHCARE DIV" || s === "DIV") return "Healthcare DIV";
                        if (s === "HEALTHCARE" || s === "HEALTH") return "Healthcare DIV";

                        // Partial matches - CRITICAL: Check multi-word phrases BEFORE single keywords
                        if (s.includes("K12") || s.includes("K-12") || s.includes("SCHOOL")) return "K12";
                        if (s.includes("HIGHER ED") || s.includes("HIGHER EDU") || s.includes("UNIVERSITY") || s.includes("COLLEGE") || s.includes("CAMPUS") || s.includes("ACADEMIC") || s.includes("HIEHGER")) return "Higher ED";
                        // Healthcare - check specific phrases before generic keywords
                        if (s.includes("DIVERSIFIED HEALTHCARE") || s.includes("HEALTHCARE DIVERSIFIED")) return "Diversified Healthcare Interiors";
                        if (s.includes("HEALTHCARE HCA") || s.includes("HCA HEALTHCARE")) return "Healthcare HCA";
                        if (s.includes("HEALTHCARE DIV") || s.includes("DIV HEALTHCARE")) return "Healthcare DIV";
                        // Single keywords - only if not matched above
                        if (s.includes("DIVERSIFIED")) return "Diversified Healthcare Interiors";
                        if (s.includes("HCA")) return "Healthcare HCA";
                        if (s.includes("HEALTHCARE") || s.includes("HEALTH CARE") || s.includes("HEALTH")) return "Healthcare DIV";
                        if (s.includes("CCC") || s.includes("CIVIC") || s.includes("CULTURAL") || s.includes("COMMUNITY") || s.includes("MUSEUM") || s.includes("LIBRARY") || s.includes("PUBLIC")) return "CCC";
                        if (s.includes("WORKPLACE") || s.includes("CORPORATE") || s.includes("COMMERCIAL") || s.includes("OFFICE") || s.includes("INTERIORS") || s.includes("STUDIO")) return "Workplace";

                        // Return as-is if it matches one of our known sectors (case-insensitive)
                        const knownSectors = ["K12", "Higher ED", "CCC", "Workplace", "Diversified Healthcare Interiors", "Healthcare HCA", "Healthcare DIV"];
                        const normalized = knownSectors.find(ks => ks.toUpperCase() === s);
                        if (normalized) return normalized;

                        // If no match, return the original string (trimmed)
                        return str.trim();
                    };

                    // Helper to detect and normalize sector (for fallback detection)
                    const detectSector = (str: string): string | null => {
                        const s = str.toUpperCase();

                        // Education
                        if (s.includes("K12") || s.includes("K-12") || s.includes("SCHOOL")) return "K12";
                        if (s.includes("HIGHER ED") || s.includes("HIGHER EDU") || s.includes("UNIVERSITY") || s.includes("COLLEGE") || s.includes("CAMPUS") || s.includes("ACADEMIC")) return "Higher ED";

                        // Healthcare - Check most specific patterns FIRST to avoid misclassification
                        // Order matters: specific multi-word phrases before single keywords
                        if (s.includes("DIVERSIFIED HEALTHCARE") || s.includes("HEALTHCARE DIVERSIFIED")) return "Diversified Healthcare Interiors";
                        if (s.includes("HEALTHCARE HCA") || s.includes("HCA HEALTHCARE")) return "Healthcare HCA";
                        if (s.includes("HEALTHCARE DIV") || s.includes("DIV HEALTHCARE")) return "Healthcare DIV";
                        // Single keyword checks (only if not already matched above)
                        if (s.includes("DIVERSIFIED")) return "Diversified Healthcare Interiors";
                        if (s.includes("HCA")) return "Healthcare HCA";
                        // Generic healthcare fallback - anything with "health" that hasn't matched goes to DIV
                        if (s.includes("HEALTHCARE") || s.includes("HEALTH CARE") || s.includes("HEALTH")) return "Healthcare DIV";

                        // CCC
                        if (s.includes("CCC") || s.includes("CIVIC") || s.includes("CULTURAL") || s.includes("COMMUNITY") || s.includes("MUSEUM") || s.includes("LIBRARY") || s.includes("PUBLIC")) return "CCC";

                        // Workplace
                        if (s.includes("WORKPLACE") || s.includes("CORPORATE") || s.includes("COMMERCIAL") || s.includes("OFFICE") || s.includes("STUDIO")) return "Workplace";

                        // Science & Tech (Preserve detection to avoid row-carryover errors)
                        if (s.includes("SCIENCE") || s.includes("S&T")) return "Science & Tech";

                        return null;
                    };

                    // Helper to detect numeric Project ID (starts with digit, min length 4)
                    // CRITICAL FIX: Ensure it is NOT a header row. Headers often have empty names or only 1 column populated.
                    // A valid project row must have:
                    // 1. A Project ID that looks numeric (or alphanumeric start) and is long enough.
                    // 2. A Project Name present in the name column.
                    const rawProjNum = String(row[projNumIdx] || "").trim();
                    const nameForCheck = String(row[nameIdx] || "").trim();
                    const isProjectRow = (/^[0-9]/.test(rawProjNum) && rawProjNum.length >= 4) && nameForCheck.length > 0;

                    // Debug Logging for "Tricky" rows
                    if (!isProjectRow && (markerA.length > 0 || markerC.length > 0)) {
                        logs.push(`Row ${i} Check: Proj#="${rawProjNum}", Name="${nameForCheck}". IsProject=${isProjectRow}. Markers: A="${markerA}", C="${markerC}"`);
                    }

                    if (!isProjectRow) {
                        const sectorFromA = detectSector(markerA);
                        const sectorFromB = detectSector(markerB);
                        const sectorFromC = detectSector(markerC);

                        if (sectorFromA) {
                            currentSector = sectorFromA;
                            logs.push(`Row ${i}: Switch Sector (Col A) -> ${currentSector}`);
                            continue;
                        }
                        if (sectorFromB) {
                            currentSector = sectorFromB;
                            logs.push(`Row ${i}: Switch Sector (Col B) -> ${currentSector}`);
                            continue;
                        }
                        if (sectorFromC) {
                            currentSector = sectorFromC;
                            logs.push(`Row ${i}: Switch Sector (Col C) -> ${currentSector}`);
                            continue;
                        }
                    }

                    // 2. Filter valid projects
                    // Must have a name and not be a sub-header row
                    // Also ensure it's not just a purely numeric row or unrelated text
                    if (!row[nameIdx] || row[nameIdx] === "PROJECT NAME") continue;

                    if (!isProjectRow) {
                        if (markerA.length > 0 || markerC.length > 0) {
                            logs.push(`Row ${i} IGNORED: Not Project, Not Sector. Markers: "${markerA}" / "${markerC}"`);
                        }
                        continue;
                    }


                    // Retrieve raw name for object creation
                    const rawName = row[nameIdx];

                    // --- Determine Sector ---
                    // Priority: 1) Sector column value, 2) Fallback to detection logic
                    let projectSector = currentSector; // Default to current sector from headers

                    if (sectorIdx !== -1 && row[sectorIdx]) {
                        // Use the Sector column value if it exists
                        const sectorValue = String(row[sectorIdx] || "").trim();
                        if (sectorValue.length > 0) {
                            projectSector = normalizeSector(sectorValue);
                            logs.push(`Row ${i}: Using Sector column value: "${sectorValue}" -> "${projectSector}"`);
                        } else {
                            // Sector column exists but is empty, try fallback detection
                            const sectorFromName = detectSector(markerA);
                            if (sectorFromName) {
                                projectSector = sectorFromName;
                                logs.push(`Row ${i}: Sector column empty, detected from name: "${projectSector}"`);
                            }
                        }
                    } else {
                        // No Sector column, use fallback detection
                        const sectorFromName = detectSector(markerA);
                        if (sectorFromName) {
                            projectSector = sectorFromName;
                            logs.push(`Row ${i}: No Sector column, detected from name: "${projectSector}"`);
                        }
                    }

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
                    const predictedVal = row[predictedEuiIdx];
                    const baselineVal = row[baselineEuiIdx];

                    const predictedEui = getNumber(predictedVal);
                    const baselineEui = getNumber(baselineVal);

                    // Explicit check for missing data to avoid 100% reduction on empty cells
                    const hasPredicted = typeof predictedVal === 'number' || (typeof predictedVal === 'string' && predictedVal.trim() !== '');

                    // Calculate reduction if both exist, else 0
                    let euiReduction = 0;
                    if (baselineEui > 0 && hasPredicted) {
                        euiReduction = (baselineEui - predictedEui) / baselineEui;
                    }

                    // Check for explicit "Meet 2030" column override
                    const meet2030Idx = [
                        findColIndex(mainHeaderRow, "Meet 2030"),
                        findColIndex(subHeaderRow, "Meet 2030"),
                        findColIndex(mainHeaderRow, "2030 Goal"),
                        findColIndex(subHeaderRow, "2030 Goal")
                    ].find(idx => idx !== -1) ?? -1;

                    let explicitMeets2030 = null;
                    if (meet2030Idx !== -1) {
                        const val = String(row[meet2030Idx] || "").trim().toLowerCase();
                        if (val.startsWith("y")) explicitMeets2030 = true;
                        if (val.startsWith("n")) explicitMeets2030 = false;
                    }

                    const calculatedMeets2030 = euiReduction >= 0.80;
                    // Prioritize explicit column if available, otherwise use calculation
                    const meets2030Goal = explicitMeets2030 !== null ? explicitMeets2030 : calculatedMeets2030;

                    // Water Reduction
                    // Often already a percentage in the sheet? Let's assume decimal or %
                    const waterReduction = getNumber(row[indWaterRedIdx]); // If it's 0.45 it means 45%

                    // Outdoor Water
                    const outdoorWaterReduction = outWaterRedIdx !== -1 ? getNumber(row[outWaterRedIdx]) : null;

                    // LPD
                    const lpdReduction = lpdIdx !== -1 ? getNumber(row[lpdIdx]) : null;


                    // Determine Eligibility Status
                    const rawEligible = String(row[eligibleIdx] || "").trim();
                    let eligibilityStatus = "No";
                    const rawLower = rawEligible.toLowerCase();

                    if (rawLower.startsWith("y") || rawLower.includes("yes")) {
                        eligibilityStatus = "Yes";
                    } else if (rawLower.includes("tbd")) {
                        eligibilityStatus = "TBD";
                    } else if (rawLower.includes("2026")) {
                        eligibilityStatus = "No 2026";
                    } else {
                        eligibilityStatus = "No";
                    }

                    // Explicit "Meets indoor Water Commitment" check
                    const meetsWaterIdx = [
                        findColIndex(mainHeaderRow, "Meets indoor Water Commitment"),
                        findColIndex(subHeaderRow, "Meets indoor Water Commitment"),
                        findColIndex(mainHeaderRow, "Indoor Water Commitment"),
                        findColIndex(subHeaderRow, "Indoor Water Commitment"),
                        findColIndex(mainHeaderRow, "Water Commitment"),
                        findColIndex(subHeaderRow, "Water Commitment"),
                        findColIndex(mainHeaderRow, "Meets Water Goal"),
                        findColIndex(subHeaderRow, "Meets Water Goal")
                    ].find(idx => idx !== -1) ?? -1;

                    let explicitMeetsWater = null;
                    if (meetsWaterIdx !== -1) {
                        const val = String(row[meetsWaterIdx] || "").trim().toLowerCase();
                        if (val.startsWith("y")) explicitMeetsWater = true;
                        if (val.startsWith("n")) explicitMeetsWater = false;
                    }

                    const calculatedMeetsWater = waterReduction >= 0.40;
                    const meetsWaterGoal = explicitMeetsWater !== null ? explicitMeetsWater : calculatedMeetsWater;

                    // Outdoor Water Explicit Check
                    const meetsOutdoorWaterIdx = [
                        findColIndex(mainHeaderRow, "Meets PW Outdoor Water Commitment"),
                        findColIndex(subHeaderRow, "Meets PW Outdoor Water Commitment"),
                        findColIndex(mainHeaderRow, "Outdoor Water Commitment"),
                        findColIndex(subHeaderRow, "Outdoor Water Commitment"),
                        findColIndex(mainHeaderRow, "PW Outdoor Water Commitment"),
                        findColIndex(subHeaderRow, "PW Outdoor Water Commitment")
                    ].find(idx => idx !== -1) ?? -1;

                    let explicitMeetsOutdoorWater = null;
                    if (meetsOutdoorWaterIdx !== -1) {
                        const val = String(row[meetsOutdoorWaterIdx] || "").trim().toLowerCase();
                        if (val.startsWith("y")) explicitMeetsOutdoorWater = true;
                        if (val.startsWith("n")) explicitMeetsOutdoorWater = false;
                    }
                    const calculatedMeetsOutdoorWater = (outdoorWaterReduction ?? 0) > 0.50;
                    const meetsOutdoorWaterGoal = explicitMeetsOutdoorWater !== null ? explicitMeetsOutdoorWater : calculatedMeetsOutdoorWater;

                    // LPD Explicit Check
                    const meetsLpdIdx = [
                        findColIndex(mainHeaderRow, "Meet 2030 LPD"),
                        findColIndex(subHeaderRow, "Meet 2030 LPD"),
                        findColIndex(mainHeaderRow, "2030 LPD Goal"),
                        findColIndex(subHeaderRow, "2030 LPD Goal")
                    ].find(idx => idx !== -1) ?? -1;

                    let explicitMeetsLpd = null;
                    if (meetsLpdIdx !== -1) {
                        const val = String(row[meetsLpdIdx] || "").trim().toLowerCase();
                        if (val.startsWith("y")) explicitMeetsLpd = true;
                        if (val.startsWith("n")) explicitMeetsLpd = false;
                    }
                    const calculatedMeetsLpd = (lpdReduction ?? 0) >= 0.25;
                    const meetsLpdGoal = explicitMeetsLpd !== null ? explicitMeetsLpd : calculatedMeetsLpd;


                    // isEligible boolean derives from status
                    const isEligible = eligibilityStatus === "Yes";


                    const project: ProjectMetrics = {
                        id: `proj-${i}`,
                        name: String(rawName),
                        sector: projectSector,
                        isEligible,
                        eligibilityStatus,
                        phase: String(row[phaseIdx] || "Unknown"),
                        archVsInt: (() => {
                            const val = String(row[archIntIdx] || "").trim();
                            if (val.toLowerCase() === 'a' || val.toLowerCase() === 'architecture') return "Architecture";
                            if (val.toLowerCase() === 'i' || val.toLowerCase() === 'interiors') return "Interiors";
                            return val || "Unknown";
                        })(),

                        resilience: {
                            euiReduction: euiReduction,
                            meets2030Goal: meets2030Goal,
                            operationalCarbonReduction: getNumber(row[opCarbonIdx]), // Placeholder if column exists
                            embodiedCarbonPathway: String(row[embodiedCarbonIdx] || "TBD"),
                            indoorWaterReduction: waterReduction,
                            outdoorWaterReduction: outdoorWaterReduction,
                            meetsOutdoorWaterGoal: meetsOutdoorWaterGoal,
                            lpdReduction: lpdReduction,
                            meetsLpdGoal: meetsLpdGoal,
                            meetsWaterGoal: meetsWaterGoal,
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

                resolve({ projects: parsedProjects, logs });

            } catch (err) {
                reject(err);
            }
        };

        reader.onerror = (err) => reject(err);
        reader.readAsBinaryString(file);
    });
};
