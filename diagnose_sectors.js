import { readFile } from 'fs/promises';
import * as XLSX from 'xlsx';
import path from 'path';

async function checkSectors() {
    try {
        const filePath = path.resolve('./LD Project Tracking - 2025 - Copy.xlsx');
        console.log(`Reading file from: ${filePath}`);

        const buf = await readFile(filePath);
        const workbook = XLSX.read(buf);

        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Convert to JSON with array of arrays
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1, range: 0, defval: null });

        console.log(`\n--- Analyzing Sector Detection ---`);

        // Check header rows
        const mainHeaderRow = data[1]; // Row 2
        const projNumIdx = mainHeaderRow.findIndex(cell => cell && cell.toString().toLowerCase().includes('project #'));
        const nameIdx = mainHeaderRow.findIndex(cell => cell && cell.toString().toLowerCase().includes('project name'));

        console.log(`Project # column: ${projNumIdx}`);
        console.log(`Project Name column: ${nameIdx}`);

        let currentSector = "Unknown";
        const sectorCounts = {};
        const sectorRows = [];

        // Scan through data rows
        for (let i = 5; i < Math.min(data.length, 200); i++) {
            const row = data[i];
            if (!row || row.length === 0) continue;

            const markerA = String(row[nameIdx] || "").trim().toUpperCase();
            const markerB = String(row[projNumIdx] || "").trim().toUpperCase();
            const markerC = String(row[0] || "").trim().toUpperCase();

            const rawProjNum = String(row[projNumIdx] || "").trim();
            const nameForCheck = String(row[nameIdx] || "").trim();
            const isProjectRow = (/^[0-9]/.test(rawProjNum) && rawProjNum.length >= 4) && nameForCheck.length > 0;

            // Detect sector headers
            const detectSector = (str) => {
                const s = str.toUpperCase();
                if (s.includes("K12") || s.includes("K-12")) return "K12";
                if (s.includes("HIGHER ED")) return "Higher ED";
                if (s.includes("DIVERSIFIED HEALTHCARE")) return "Diversified Healthcare Interiors";
                if (s.includes("HEALTHCARE HCA")) return "Healthcare HCA";
                if (s.includes("HEALTHCARE DIV")) return "Healthcare DIV";
                if (s.includes("DIVERSIFIED")) return "Diversified Healthcare Interiors";
                if (s.includes("HCA")) return "Healthcare HCA";
                if (s.includes("HEALTHCARE") || s.includes("HEALTH")) return "Healthcare DIV";
                if (s.includes("CCC") || s.includes("CIVIC")) return "CCC";
                if (s.includes("WORKPLACE") || s.includes("CORPORATE")) return "Workplace";
                return null;
            };

            if (!isProjectRow) {
                const sectorFromA = detectSector(markerA);
                const sectorFromB = detectSector(markerB);
                const sectorFromC = detectSector(markerC);

                if (sectorFromA || sectorFromB || sectorFromC) {
                    const newSector = sectorFromA || sectorFromB || sectorFromC;
                    currentSector = newSector;
                    sectorRows.push({ row: i + 1, sector: currentSector, markers: { A: markerA, B: markerB, C: markerC } });
                }
                continue;
            }

            // Count projects per sector
            if (isProjectRow) {
                sectorCounts[currentSector] = (sectorCounts[currentSector] || 0) + 1;
            }
        }

        console.log(`\n--- Sector Headers Found ---`);
        sectorRows.forEach(sr => {
            console.log(`Row ${sr.row}: ${sr.sector}`);
            console.log(`  Markers - A: "${sr.markers.A}", B: "${sr.markers.B}", C: "${sr.markers.C}"`);
        });

        console.log(`\n--- Project Counts by Sector ---`);
        Object.entries(sectorCounts).forEach(([sector, count]) => {
            console.log(`${sector}: ${count} projects`);
        });

    } catch (error) {
        console.error('Error:', error);
    }
}

checkSectors();
