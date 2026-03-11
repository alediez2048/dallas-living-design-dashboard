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
    // Group reporting years
    const activeYears = Array.from(new Set(projects.map(p => p.reportingYear))).sort((a, b) => b - a);

    // Default to scalar counts if we only have 1 year or `total` isn't an array (fallback safety)
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

    // YoY Logic
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
                const latestPerc = (latestCount / latestTotal) * 100;
                const prevPerc = (prevCount / prevTotal) * 100;
                const diff = latestPerc - prevPerc;
                isPositive = diff >= 0;
                deltaText = `${Math.abs(diff).toFixed(1)}% vs ${prevYear}`;
            }
        } else {
            // Raw count diff fallback
            const diff = latestCount - prevCount;
            isPositive = diff >= 0;
            deltaText = `${Math.abs(diff)} vs ${prevYear}`;
        }
    }

    return (
        <motion.div
            variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } }}
            initial="hidden"
            animate="visible"
            className={`metric-card-container relative ${compact ? 'p-3' : 'p-5'} rounded-2xl bg-white/80 dark:bg-[#1e1e1e]/80 backdrop-blur-sm border border-gray-200 dark:border-white/5 flex flex-col justify-between ${onClick ? 'hover:border-gray-300 dark:hover:border-white/20 cursor-pointer hover:scale-[1.02] active:scale-[0.98]' : ''} transition-all duration-200 shadow-sm dark:shadow-none h-full ${compact ? 'min-h-[80px]' : 'min-h-[140px]'}`}
            onClick={() => onClick && onClick(label, projects)}
        >
            {/* Top section: Label and main value */}
            <div>
                <h3 className={`text-gray-500 dark:text-gray-400 ${compact ? 'mb-1 text-xs' : 'mb-3 text-sm'} font-medium`}>{label}</h3>
                <div className="flex items-baseline gap-1">
                    {percentage !== null ? (
                        <p className={`metric-value ${compact ? 'text-xl' : 'text-4xl'} font-bold bg-gradient-to-r ${color} bg-clip-text text-transparent`}>
                            {percentage}%
                        </p>
                    ) : (
                        <p className={`metric-value ${compact ? 'text-xl' : 'text-4xl'} font-bold bg-gradient-to-r ${color} bg-clip-text text-transparent`}>
                            {count}
                        </p>
                    )}
                </div>
            </div>

            {/* Bottom section */}
            <div className={`flex items-end justify-between ${compact ? 'mt-1' : 'mt-3'}`}>
                {/* Left: YoY delta layer */}
                <div>
                    {deltaText && (
                        <span className={`inline-flex items-center gap-1 ${compact ? 'text-[9px] px-1.5 py-0.5' : 'text-xs px-2 py-1'} rounded-md font-medium ${isPositive ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400'}`}>
                            {isPositive ? '↑' : '↓'} {deltaText}
                        </span>
                    )}
                </div>

                {/* Right: Fraction */}
                {totalCount !== undefined && (
                    <span className={`${compact ? 'text-[10px]' : 'text-xs'} text-gray-400 dark:text-gray-500 font-medium whitespace-nowrap`}>
                        {count} / {totalCount}
                    </span>
                )}
            </div>
        </motion.div>
    );
};
