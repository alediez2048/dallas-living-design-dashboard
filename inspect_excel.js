import { readFile } from 'fs/promises';
import * as XLSX from 'xlsx';
import path from 'path';

async function inspectExcel() {
    try {
        const filePath = path.resolve('./LD Project Tracking - 2025 - Copy.xlsx');
        console.log(`Reading file from: ${filePath}`);

        const buf = await readFile(filePath);
        const workbook = XLSX.read(buf);

        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Convert to JSON with array of arrays to see raw structure (including empty cells)
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1, range: 0, defval: null });

        console.log(`\n--- Sheet Name: ${sheetName} ---`);
        console.log(`Total Rows: ${data.length}`);

        console.log('\n--- First 10 Rows of Raw Data ---');
        data.slice(0, 10).forEach((row, index) => {
            console.log(`Row ${index + 1}:`, JSON.stringify(row));
        });

        // Find Sector Column
        const headerRowIndex = 4; // Row 5
        const headerRow = data[headerRowIndex];
        const sectorColIndex = headerRow.findIndex(cell => cell && cell.toString().toLowerCase().includes('sector'));

        if (sectorColIndex !== -1) {
            console.log(`\nFound Sector column at index ${sectorColIndex}`);
            const sectors = new Set();
            for (let i = headerRowIndex + 1; i < data.length; i++) {
                const val = data[i][sectorColIndex];
                if (val) sectors.add(val);
            }
            console.log("Unique Sectors:", Array.from(sectors));
        } else {
            console.log("\nCould not find 'Sector' column in Row 5");
        }

    } catch (error) {
        console.error('Error reading file:', error);
    }
}

inspectExcel();
