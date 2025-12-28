import React, { forwardRef } from 'react';
import { ProjectMetrics } from '../../types';
import { SectorReport } from './SectorReport';

interface FullReportProps {
    projects: ProjectMetrics[];
}

export const FullReport = forwardRef<HTMLDivElement, FullReportProps>(({ projects }, ref) => {
    // 1. All Studio (Living Design Dallas)
    // 2. Iterate Unique Sectors
    // We normalize sectors to ensure clean grouping? 
    // The parser already normalizes them.
    const sectors = Array.from(new Set(projects.map(p => p.sector))).filter(s => s && s !== 'Unknown Sector').sort();

    return (
        <div ref={ref} className="print-container text-black">
            {/* Page 1: Studio Overview */}
            <SectorReport title="Living Design Dallas" projects={projects} />

            {/* Sector Pages */}
            {sectors.map(sector => (
                <SectorReport
                    key={sector}
                    title={sector + " Overview"}
                    projects={projects.filter(p => p.sector === sector)}
                />
            ))}
        </div>
    );
});
FullReport.displayName = 'FullReport';
