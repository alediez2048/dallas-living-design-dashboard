import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProjectMetrics } from '../types';

interface ProjectListModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    projects: ProjectMetrics[];
}

export const ProjectListModal: React.FC<ProjectListModalProps> = ({
    isOpen,
    onClose,
    title,
    projects,
}) => {
    const [hoveredProject, setHoveredProject] = useState<string | null>(null);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    />

                    {/* Modal Container */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
                    >
                        <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-2xl w-full max-w-5xl max-h-[80vh] flex flex-col pointer-events-auto border border-gray-200 dark:border-white/10 overflow-hidden m-4">

                            {/* Header */}
                            <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-white/5 bg-white/50 dark:bg-[#1e1e1e]/50 backdrop-blur-md">
                                <div>
                                    <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-teal-500 dark:from-blue-200 dark:to-teal-200 bg-clip-text text-transparent">
                                        {title}
                                    </h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        Showing {projects.length} projects meeting this criteria
                                    </p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 transition-colors"
                                >
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Scrollable Content */}
                            <div className="overflow-auto flex-1 p-6 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-white/10 hover:scrollbar-thumb-gray-300 dark:hover:scrollbar-thumb-white/20">
                                <table className="min-w-full text-left text-sm text-gray-500 dark:text-gray-400 border-collapse">
                                    <thead className="text-xs uppercase bg-gray-50/90 dark:bg-[#1a1a1a]/90 text-gray-700 dark:text-gray-200 sticky top-0 backdrop-blur-md z-10 shadow-sm">
                                        <tr>
                                            <th className="px-5 py-4 rounded-tl-lg">Project Name</th>
                                            <th className="px-5 py-4">Sector</th>
                                            <th className="px-5 py-4">Type</th>
                                            <th className="px-5 py-4">Phase</th>
                                            <th className="px-5 py-4 text-center">Eligible?</th>
                                            <th className="px-5 py-4 text-right">EUI Red.</th>
                                            <th className="px-5 py-4 text-right rounded-tr-lg">Water Red.</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                        {projects.map((p, i) => (
                                            <motion.tr
                                                key={p.id}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.03 }}
                                                onMouseEnter={() => setHoveredProject(p.id)}
                                                onMouseLeave={() => setHoveredProject(null)}
                                                className={`
                          transition-all duration-200 cursor-default
                          ${hoveredProject === p.id ? 'bg-blue-50/50 dark:bg-white/10 scale-[1.01] shadow-lg' : 'hover:bg-gray-50 dark:hover:bg-white/5'}
                        `}
                                            >
                                                <td className="px-5 py-3 font-medium text-gray-900 dark:text-white transition-colors truncate max-w-[300px] border-l-4 border-transparent hover:border-blue-400">
                                                    {p.name}
                                                </td>
                                                <td className="px-5 py-3 opacity-80">{p.sector}</td>
                                                <td className="px-5 py-3 opacity-80">
                                                    <span className={`px-3 py-1.5 rounded-lg text-sm ${p.archVsInt === 'Architecture' ? 'bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-300' : p.archVsInt === 'Interiors' ? 'bg-teal-100 text-teal-600 dark:bg-teal-500/20 dark:text-teal-300' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'}`}>
                                                        {p.archVsInt}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3 opacity-80">
                                                    <span className="px-2 py-1 rounded-md bg-gray-100 dark:bg-white/5 text-xs">{p.phase}</span>
                                                </td>
                                                <td className="px-5 py-3 text-center">
                                                    {(() => {
                                                        const status = p.eligibilityStatus || (p.isEligible ? "Yes" : "No");
                                                        let colorClass = "bg-gray-100 dark:bg-gray-700/50 text-gray-500";
                                                        let text = "N";

                                                        if (status === "Yes") {
                                                            colorClass = "bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400";
                                                            text = "Y";
                                                        } else if (status === "TBD") {
                                                            colorClass = "bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 w-auto px-2";
                                                            text = "TBD";
                                                        } else if (status === "No 2026") {
                                                            colorClass = "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 w-auto px-2";
                                                            text = "2026";
                                                        }
                                                        return (
                                                            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${colorClass}`}>
                                                                {text}
                                                            </span>
                                                        );
                                                    })()}
                                                </td>
                                                <td className="px-5 py-3 text-right font-medium">
                                                    <span className={`${(p.resilience.euiReduction || 0) >= 0.8 ? 'text-green-500' : 'text-gray-900 dark:text-gray-300'}`}>
                                                        {p.resilience.euiReduction ? `${Math.round(p.resilience.euiReduction * 100)}%` : '-'}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3 text-right font-medium">
                                                    <span className={`${(p.resilience.indoorWaterReduction || 0) >= 0.45 ? 'text-blue-500' : 'text-gray-900 dark:text-gray-300'}`}>
                                                        {p.resilience.indoorWaterReduction ? `${Math.round(p.resilience.indoorWaterReduction * 100)}%` : '-'}
                                                    </span>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
