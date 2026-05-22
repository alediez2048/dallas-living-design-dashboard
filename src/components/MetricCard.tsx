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
        ? 'text-green-600 dark:text-green-400'
        : isLower
            ? 'text-red-500 dark:text-red-400'
            : 'text-gray-400 dark:text-gray-500';

    return (
        <motion.div
            variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } }}
            initial="hidden"
            animate="visible"
            className={`metric-card-container relative ${compact ? 'p-3' : 'p-5'} rounded-2xl bg-white/80 dark:bg-[#1e1e1e]/80 backdrop-blur-sm border border-gray-200 dark:border-white/5 flex flex-col justify-between ${onClick ? 'hover:border-gray-300 dark:hover:border-white/20 cursor-pointer hover:scale-[1.02] active:scale-[0.98]' : ''} transition-all duration-200 shadow-sm dark:shadow-none h-full ${compact ? 'min-h-[80px]' : 'min-h-[140px]'}`}
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
            <div className={`flex items-end justify-between ${compact ? 'mt-1' : 'mt-3'}`}>
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
                    <span className={`${compact ? 'text-[10px]' : 'text-xs'} text-gray-400 dark:text-gray-500 font-medium whitespace-nowrap`}>
                        {count} / {totalCount} projects
                    </span>
                )}
            </div>
        </motion.div>
    );
};

