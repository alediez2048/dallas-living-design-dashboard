import { motion } from 'framer-motion';
import { ProjectMetrics } from '../types';

interface MetricCardProps {
    label: string;
    projects: ProjectMetrics[];
    total?: number;
    color: string;
    onClick?: (title: string, projects: ProjectMetrics[]) => void;
    compact?: boolean; // For smaller cards in PDF export
}

export const MetricCard = ({ label, projects, total, color, onClick, compact = false }: MetricCardProps) => {
    const count = projects.length;
    const percentage = total !== undefined && total > 0
        ? ((count / total) * 100).toFixed(1)
        : null;

    return (
        <motion.div
            variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } }}
            className={`${compact ? 'p-3' : 'p-5'} rounded-2xl bg-white/80 dark:bg-[#1e1e1e]/80 backdrop-blur-sm border border-gray-200 dark:border-white/5 flex flex-col justify-between ${onClick ? 'hover:border-gray-300 dark:hover:border-white/20 cursor-pointer hover:scale-[1.02] active:scale-[0.98]' : ''} transition-all duration-200 shadow-sm dark:shadow-none h-full ${compact ? 'min-h-[80px]' : 'min-h-[140px]'}`}
            onClick={() => onClick && onClick(label, projects)}
        >
            {/* Top section: Label and main value */}
            <div>
                <h3 className={`text-gray-500 dark:text-gray-400 ${compact ? 'mb-1 text-xs' : 'mb-3 text-sm'} font-medium`}>{label}</h3>
                <div className="flex items-baseline gap-1">
                    {percentage !== null ? (
                        /* Show percentage prominently when there's a total */
                        <p className={`${compact ? 'text-xl' : 'text-4xl'} font-bold bg-gradient-to-r ${color} bg-clip-text text-transparent`}>
                            {percentage}%
                        </p>
                    ) : (
                        /* Show count for cards without a total */
                        <p className={`${compact ? 'text-xl' : 'text-4xl'} font-bold bg-gradient-to-r ${color} bg-clip-text text-transparent`}>
                            {count}
                        </p>
                    )}
                </div>
            </div>

            {/* Bottom section: Fraction in bottom right */}
            {total !== undefined && (
                <div className={`flex justify-end ${compact ? 'mt-1' : 'mt-3'}`}>
                    <span className={`${compact ? 'text-[10px]' : 'text-xs'} text-gray-400 dark:text-gray-500 font-medium`}>
                        {count} / {total}
                    </span>
                </div>
            )}
        </motion.div>
    );
};
