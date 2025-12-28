import { motion } from 'framer-motion';
import { ProjectMetrics } from '../types';

interface MetricCardProps {
    label: string;
    projects: ProjectMetrics[];
    total?: number;
    color: string;
    onClick?: (title: string, projects: ProjectMetrics[]) => void;
}

export const MetricCard = ({ label, projects, total, color, onClick }: MetricCardProps) => (
    <motion.div
        variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } }}
        className={`p-5 rounded-2xl bg-white/80 dark:bg-[#1e1e1e]/80 backdrop-blur-sm border border-gray-200 dark:border-white/5 flex flex-col justify-center ${onClick ? 'hover:border-gray-300 dark:hover:border-white/20 cursor-pointer hover:scale-[1.02] active:scale-[0.98]' : ''} transition-all duration-200 shadow-sm dark:shadow-none h-full`}
        onClick={() => onClick && onClick(label, projects)}
    >
        <h3 className="text-gray-500 dark:text-gray-400 mb-2 font-medium text-sm h-10 flex items-center">{label}</h3>
        <div className="flex items-baseline gap-2">
            <p className={`text-4xl font-bold bg-gradient-to-r ${color} bg-clip-text text-transparent`}>
                {projects.length}
            </p>
            {total !== undefined && (
                <span className="text-xs text-gray-500 uppercase tracking-wider">/ {total}</span>
            )}
        </div>
    </motion.div>
);
