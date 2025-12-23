
import { parseProjectData } from './src/utils/parser';
import * as fs from 'fs';

// Mock File object for node environment
class MockFile {
    name: string;
    buffer: Buffer;

    constructor(path: string) {
        this.name = path;
        this.buffer = fs.readFileSync(path);
    }

    async arrayBuffer() {
        return this.buffer.buffer.slice(this.buffer.byteOffset, this.buffer.byteOffset + this.buffer.byteLength);
    }
}

async function check() {
    try {
        const file = new MockFile('./LD Project Tracking - 2025 - Copy.xlsx');
        // @ts-ignore
        const projects = await parseProjectData(file);

        const sectors = new Set(projects.map(p => p.sector));
        console.log("Unique Sectors Found:", Array.from(sectors));
    } catch (e) {
        console.error(e);
    }
}

check();
