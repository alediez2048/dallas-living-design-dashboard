import { motion } from 'framer-motion';
import { ProjectMetrics } from '../types';

interface MetricCardProps {
    label: string;
    projects: ProjectMetrics[];
    total?: number | ProjectMetrics[];
    color: string;
    onClick?: (title: string, projects: ProjectMetrics[]) => void;
    compact?: boolean; // For smaller cards in PDF export
}

export const MetricCard = ({ label, projects, total, color, onClick, compact = false }: MetricCardProps) => {
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
            const thisPerc = parseFloat(percentage ?? '0');
            const deltaVal = Math.abs(thisPerc - prevPerc).toFixed(1);
            prevLabel = `${deltaVal}% vs ${prevYear} (was ${prevPerc.toFixed(1)}%)`;
            isHigher = thisPerc > prevPerc;
            isLower  = thisPerc < prevPerc;
        } else {
            // Raw count mode
            const deltaVal = Math.abs(count - prevCount);
            prevLabel = `${deltaVal} vs ${prevYear} (was ${prevCount})`;
            isHigher = count > prevCount;
            isLower  = count < prevCount;
        }
    }

    const prevLabelColor = isHigher
        ? 'text-green-600 dark:text-green-400'
        : isLower
            ? 'text-red-500 dark:text-red-400'
            : 'text-gray-400 dark:text-gray-500';

    // Chronological years (oldest → newest)
    const chronologicalYears = [...allYears].reverse();

    // Calculate yearly values for sparkline
    const yearlyTrendData = hasMultiYear ? chronologicalYears.map(y => {
        const yearProjects = projects.filter(p => p.reportingYear === y);
        const yearCount = yearProjects.length;
        let yearValue: number;
        let yearDisplay: string;
        
        if (totalCount !== undefined) {
            let yearTotal = 0;
            if (typeof total === 'number') {
                yearTotal = total;
            } else if (Array.isArray(total)) {
                yearTotal = total.filter(p => p.reportingYear === y).length;
            }
            const yearPerc = yearTotal > 0 ? (yearCount / yearTotal) * 100 : 0;
            yearValue = yearPerc;
            yearDisplay = `${yearPerc.toFixed(1)}%`;
        } else {
            yearValue = yearCount;
            yearDisplay = `${yearCount}`;
        }
        
        return {
            year: y,
            value: yearValue,
            display: yearDisplay
        };
    }) : [];

    const maxTrendVal = yearlyTrendData.length > 0 ? Math.max(1, ...yearlyTrendData.map(d => d.value)) : 1;

    return (
        <motion.div
            variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } }}
            initial="hidden"
            animate="visible"
            className={`metric-card-container relative ${compact ? 'p-3' : 'p-5'} rounded-2xl bg-white/80 dark:bg-[#1e1e1e]/80 backdrop-blur-sm border border-gray-200 dark:border-white/5 flex flex-col justify-between ${onClick ? 'hover:border-gray-300 dark:hover:border-white/20 cursor-pointer hover:scale-[1.02] active:scale-[0.98]' : ''} transition-all duration-200 shadow-sm dark:shadow-none h-full`}
            onClick={() => onClick && onClick(label, displayProjects)}
        >
            {/* Top: label + KPI value (latest year only) */}
            <div>
                <h3 className={`text-gray-500 dark:text-gray-400 ${compact ? 'mb-1 text-xs' : 'mb-3 text-sm'} font-medium`}>
                    {label}
                    {hasMultiYear && latestYear && (
                        <span className="ml-1.5 text-[10px] font-normal text-gray-400 dark:text-gray-500">
                            {latestYear}
                        </span>
                    )}
                </h3>
                <p className={`metric-value ${compact ? 'text-xl' : 'text-4xl'} font-bold bg-gradient-to-r ${color} bg-clip-text text-transparent`}>
                    {percentage !== null ? `${percentage}%` : count}
                </p>
            </div>

            {/* Bottom: prev-year context + fraction */}
            <div className={`flex ${compact ? 'flex-col items-start gap-0.5 mt-1' : 'items-end justify-between mt-3'} ${hasMultiYear && !compact ? 'border-b border-gray-100 dark:border-white/5 pb-3 mb-1' : ''}`}>
                {/* Previous year reference label */}
                <div>
                    {prevLabel && (
                        <span className={`${compact ? 'text-[9px]' : 'text-xs'} font-medium ${prevLabelColor}`}>
                            {isHigher ? '↑' : isLower ? '↓' : ''} {prevLabel}
                        </span>
                    )}
                </div>

                {/* Fraction denominator */}
                {totalCount !== undefined && (
                    <span className={`${compact ? 'text-[9px]' : 'text-xs'} text-gray-400 dark:text-gray-500 font-medium whitespace-nowrap`}>
                        {count}/{totalCount} {compact ? 'eligible' : 'eligible projects'}
                    </span>
                )}
            </div>

            {/* Yearly Trend Sparkline (visible on screen in multi-year mode) */}
            {hasMultiYear && !compact && yearlyTrendData.length > 0 && (
                <div className="mt-3 pt-2">
                    <p className="text-[9px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Yearly Trend</p>
                    <div className="flex items-end gap-3 h-10 px-1">
                        {yearlyTrendData.map(d => {
                            const barHeightPct = (d.value / maxTrendVal) * 100;
                            return (
                                <div key={d.year} className="flex-1 flex flex-col items-center group/trend relative">
                                    {/* Tooltip displaying the year's full value on hover */}
                                    <div className="absolute bottom-full mb-1 bg-gray-900 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover/trend:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow">
                                        {d.year}: {d.display}
                                    </div>
                                    <div className="w-full bg-gray-100 dark:bg-white/5 rounded-t-sm h-6 relative overflow-hidden">
                                        <div 
                                            className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t ${color} rounded-t-sm transition-all duration-500`}
                                            style={{ height: `${Math.max(15, barHeightPct)}%` }}
                                        />
                                    </div>
                                    <span className="text-[9px] text-gray-400 dark:text-gray-500 mt-1 font-medium">'{d.year.toString().slice(-2)}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </motion.div>
    );
};

