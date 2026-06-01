import { ProjectMetrics } from '../../types';

interface PrintMetricCardProps {
    label: string;
    projects: ProjectMetrics[];
    total?: number | ProjectMetrics[];
    color?: string;
    compact?: boolean;
    onClick?: (label: string, projects: ProjectMetrics[]) => void; // ignored in print, kept for API compat
}

/**
 * A print-safe version of MetricCard using a plain <div> with no Framer Motion.
 * Used exclusively in SectorReport / FullReport for PDF export.
 *
 * Framer Motion's motion.div is rendered offscreen by react-to-print and never
 * transitions from opacity:0 → opacity:1, making all cards invisible in the output.
 * This component avoids that entirely.
 */
export const PrintMetricCard = ({ label, projects, total, color, compact = false }: PrintMetricCardProps) => {
    // Sort available years newest → oldest
    const allYears = Array.from(new Set(projects.map(p => p.reportingYear))).sort((a, b) => b - a);
    const hasMultiYear = allYears.length > 1;
    const latestYear = hasMultiYear ? allYears[0] : null;
    const prevYear  = hasMultiYear ? allYears[1] : null;

    // ── Main KPI: always show ONLY the latest year (never combine years) ──────
    const displayProjects = hasMultiYear
        ? projects.filter(p => p.reportingYear === latestYear)
        : projects;
    const count = displayProjects.length;

    // Total denominator — also scoped to latest year when multi-year
    let totalCount: number | undefined;
    let prevTotalCount: number | undefined;
    if (typeof total === 'number') {
        totalCount = total; // scalar denominator — use as-is
    } else if (Array.isArray(total)) {
        totalCount = hasMultiYear
            ? total.filter(p => p.reportingYear === latestYear).length
            : total.length;
        if (hasMultiYear && prevYear !== null) {
            prevTotalCount = total.filter(p => p.reportingYear === prevYear).length;
        }
    }

    const percentage = totalCount !== undefined && totalCount > 0
        ? ((count / totalCount) * 100).toFixed(1)
        : null;

    // ── Previous-year context label ───────────────────────────────────────────
    // Shows the prior year's raw value below the KPI (no %, just the number)
    // so viewers can compare at a glance.
    let prevLabel: string | null = null;
    let isHigher = false;
    let isLower  = false;

    if (hasMultiYear && prevYear !== null) {
        const prevProjects = projects.filter(p => p.reportingYear === prevYear);
        const prevCount    = prevProjects.length;

        if (prevTotalCount !== undefined && prevTotalCount > 0) {
            // Percentage mode: compare % this year vs % last year
            const prevPerc = (prevCount / prevTotalCount) * 100;
            prevLabel = `${prevPerc.toFixed(1)}% in ${prevYear}`;
            const thisPerc = parseFloat(percentage ?? '0');
            isHigher = thisPerc > prevPerc;
            isLower  = thisPerc < prevPerc;
        } else {
            // Raw count mode
            prevLabel = `${prevCount} in ${prevYear}`;
            isHigher = count > prevCount;
            isLower  = count < prevCount;
        }
    }

    const prevLabelColor = isHigher
        ? '#16a34a' // P&W green
        : isLower
            ? '#dd4832' // P&W coral
            : '#9ca3af'; // gray

    // Helper to resolve solid Perkins & Will brand colors for printing
    const getSolidColor = (colorStyle?: string) => {
        if (!colorStyle) return '#001e62'; // P&W Navy default
        const styleLower = colorStyle.toLowerCase();
        if (styleLower.includes('purple')) return '#440099'; // P&W Dark Purple
        if (styleLower.includes('teal')) return '#009b77';   // P&W Medium Teal
        if (styleLower.includes('blue')) return '#1818a5';   // P&W Medium Blue
        if (styleLower.includes('green') || styleLower.includes('emerald')) return '#007a5f'; // P&W Green
        if (styleLower.includes('red') || styleLower.includes('coral')) return '#dd4832';     // P&W Coral
        if (styleLower.includes('orange')) return '#ffa900'; // P&W Amber
        if (styleLower.includes('yellow')) return '#ffa900'; // P&W Amber
        if (styleLower.includes('lime')) return '#bfc820';   // P&W Lime
        return '#001e62';
    };

    const textColor = getSolidColor(color);

    return (
        <div
            style={{
                padding: compact ? '8px' : '16px',
                borderRadius: '12px',
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                height: '100%',
                minHeight: compact ? '72px' : '120px',
                boxSizing: 'border-box',
            }}
        >
            <div>
                <p style={{
                    fontSize: compact ? '10px' : '12px',
                    color: '#6b7280',
                    fontWeight: 500,
                    margin: 0,
                    marginBottom: compact ? '2px' : '4px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                }}>
                    {label}
                    {hasMultiYear && latestYear && (
                        <span style={{ marginLeft: '6px', fontSize: '9px', fontWeight: 400, color: '#9ca3af', textTransform: 'none' }}>
                            ({latestYear})
                        </span>
                    )}
                </p>
                <p style={{
                    fontSize: compact ? '22px' : '36px',
                    fontWeight: 700,
                    color: textColor,
                    margin: 0,
                    lineHeight: 1.1,
                }}>
                    {percentage !== null ? `${percentage}%` : count}
                </p>
            </div>

            <div style={{
                display: 'flex',
                flexDirection: compact ? 'column' : 'row',
                alignItems: compact ? 'flex-start' : 'flex-end',
                justifyContent: 'space-between',
                marginTop: compact ? '4px' : '12px',
                gap: compact ? '2px' : '0px',
            }}>
                <div>
                    {prevLabel && (
                        <span style={{
                            fontSize: '9px',
                            fontWeight: 600,
                            color: prevLabelColor,
                        }}>
                            {isHigher ? '↑' : isLower ? '↓' : ''} {prevLabel}
                        </span>
                    )}
                </div>
                {totalCount !== undefined && (
                    <span style={{ 
                        fontSize: compact ? '9px' : '10px', 
                        color: '#9ca3af', 
                        fontWeight: 500,
                        whiteSpace: 'nowrap'
                    }}>
                        {count}{compact ? '/' : ' / '}{totalCount} {compact ? 'eligible' : 'eligible projects'}
                    </span>
                )}
            </div>
        </div>
    );
};
