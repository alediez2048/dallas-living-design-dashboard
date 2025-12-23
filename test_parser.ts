import { ProjectMetrics } from '../types';
import * as XLSX from 'xlsx';
import { readFile } from 'fs/promises';
import path from 'path';

// Mirroring the browser-parser logic but for Node.js environment to test
const parseNode = async (filePath: string): Promise<ProjectMetrics[]> => {
    const buf = await readFile(filePath);
    const workbook = XLSX.read(buf, { type: 'buffer' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawData = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1, defval: null });

    const mainHeaderRow = rawData[5];
    const subHeaderRow = rawData[6];

    const findColIndex = (row: any[], keyword: string): number => {
        return row.findIndex((cell) =>
            typeof cell === 'string' && cell.toLowerCase().includes(keyword.toLowerCase())
        );
    };

    const nameIdx = findColIndex(mainHeaderRow, "PROJECT NAME");
    const eligibleIdx = findColIndex(mainHeaderRow, "Eligible for reporting?");
    const phaseIdx = findColIndex(mainHeaderRow, "Phase");
    const predictedEuiIdx = findColIndex(subHeaderRow, "Predicted Net EUI");
    const baselineEuiIdx = findColIndex(subHeaderRow, "AIA Baseline EUI");
    const opCarbonIdx = findColIndex(mainHeaderRow, "Operational Carbon");
    const embodiedCarbonIdx = findColIndex(mainHeaderRow, "Embodied Carbon");
    const indWaterRedIdx = findColIndex(subHeaderRow, "Ttl Flow: Potable Water Use Reduction");
    const ecologyIdx = findColIndex(mainHeaderRow, "Ecology");
    const resilienceIdx = findColIndex(mainHeaderRow, "Resilience - 1~3");
    const switchListIdx = findColIndex(mainHeaderRow, "Switch List Vetted");
    const airIdx = findColIndex(mainHeaderRow, "Air");
    const lightIdx = findColIndex(mainHeaderRow, "Light");
    const thermalIdx = findColIndex(mainHeaderRow, "Thermal Comfort");
    const acousticIdx = findColIndex(mainHeaderRow, "Acoustic Perform");
    const waterQualityIdx = findColIndex(mainHeaderRow, "Water Quality");
    const biophiliaIdx = findColIndex(mainHeaderRow, "Biophilia");

    const parsedProjects: ProjectMetrics[] = [];
    let currentSector = "Unknown Sector";

    for (let i = 8; i < rawData.length; i++) {
        const row = rawData[i];
        if (!row || row.length === 0) continue;

        const rawName = row[nameIdx];
        if (typeof rawName === 'string' && (rawName.includes("EDUCATION") || rawName.includes("HEALTHCARE") || rawName.includes("COMMERCIAL") || rawName.includes("SCIENCE"))) {
            currentSector = rawName.split("(")[0].trim();
            continue;
        }

        if (!rawName || rawName === "PROJECT NAME") continue;

        const getNumber = (val: any): number => {
            if (typeof val === 'number') return val;
            if (typeof val === 'string') {
                const clean = val.replace(/%/g, '').trim();
                const parsed = parseFloat(clean);
                return isNaN(parsed) ? 0 : parsed;
            }
            return 0;
        };
        const getScore = (val: any): number => (typeof val === 'number' ? val : val ? 1 : 0);

        const predictedEui = getNumber(row[predictedEuiIdx]);
        const baselineEui = getNumber(row[baselineEuiIdx]);
        let euiReduction = 0;
        if (baselineEui > 0) {
            euiReduction = (baselineEui - predictedEui) / baselineEui;
        }

        const waterReduction = getNumber(row[indWaterRedIdx]);

        const project: ProjectMetrics = {
            id: `proj-${i}`,
            name: String(rawName),
            sector: currentSector,
            isEligible: String(row[eligibleIdx]).toLowerCase().includes('yes') || String(row[eligibleIdx]).toLowerCase().includes('eligible'),
            phase: String(row[phaseIdx] || "Unknown"),

            resilience: {
                euiReduction: euiReduction,
                meets2030Goal: euiReduction >= 0.80,
                operationalCarbonReduction: getNumber(row[opCarbonIdx]),
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
    return parsedProjects;
};

// Run the test
(async () => {
    try {
        const projects = await parseNode(path.resolve('./LD Project Tracking - 2025 - Copy.xlsx'));
        console.log(`Successfully parsed ${projects.length} projects.`);
        console.log("Sample Project:", JSON.stringify(projects[projects.length - 1], null, 2));
    } catch (e) {
        console.error(e);
    }
})();
