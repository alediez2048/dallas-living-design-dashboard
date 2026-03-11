import { ProjectMetrics } from '../../types';

interface PrintMetricCardProps {
    label: string;
    projects: ProjectMetrics[];
    total?: number | ProjectMetrics[];
    color?: string;    // unused in print, kept for API compat
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
export const PrintMetricCard = ({ label, projects, total, compact = false }: PrintMetricCardProps) => {
    const count = projects.length;

    let totalCount: number | undefined;
    if (typeof total === 'number') {
        totalCount = total;
    } else if (Array.isArray(total)) {
        totalCount = total.length;
    }

    const percentage = totalCount !== undefined && totalCount > 0
        ? ((count / totalCount) * 100).toFixed(1)
        : null;

    // YoY delta
    const activeYears = Array.from(new Set(projects.map(p => p.reportingYear))).sort((a, b) => b - a);
    let deltaText: string | null = null;
    let isPositive = true;

    if (activeYears.length > 1) {
        const latestYear = activeYears[0];
        const prevYear = activeYears[1];
        const latestCount = projects.filter(p => p.reportingYear === latestYear).length;
        const prevCount = projects.filter(p => p.reportingYear === prevYear).length;

        if (Array.isArray(total)) {
            const latestTotal = total.filter(p => p.reportingYear === latestYear).length;
            const prevTotal = total.filter(p => p.reportingYear === prevYear).length;
            if (latestTotal > 0 && prevTotal > 0) {
                const diff = (latestCount / latestTotal - prevCount / prevTotal) * 100;
                isPositive = diff >= 0;
                deltaText = `${Math.abs(diff).toFixed(1)}% vs ${prevYear}`;
            }
        } else {
            const diff = latestCount - prevCount;
            isPositive = diff >= 0;
            deltaText = `${Math.abs(diff)} vs ${prevYear}`;
        }
    }

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
                </p>
                <p style={{
                    fontSize: compact ? '22px' : '36px',
                    fontWeight: 700,
                    color: '#111827',
                    margin: 0,
                    lineHeight: 1.1,
                }}>
                    {percentage !== null ? `${percentage}%` : count}
                </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: '4px' }}>
                {deltaText && (
                    <span style={{
                        fontSize: '9px',
                        fontWeight: 600,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: isPositive ? '#dcfce7' : '#fee2e2',
                        color: isPositive ? '#166534' : '#991b1b',
                    }}>
                        {isPositive ? '↑' : '↓'} {deltaText}
                    </span>
                )}
                {totalCount !== undefined && (
                    <span style={{ fontSize: '10px', color: '#9ca3af', fontWeight: 500 }}>
                        {count} / {totalCount}
                    </span>
                )}
            </div>
        </div>
    );
};
