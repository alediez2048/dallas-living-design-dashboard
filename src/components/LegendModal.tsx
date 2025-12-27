import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, HelpCircle, MinusCircle, Clock, BookOpen, Ruler, Layers, List } from 'lucide-react';

interface LegendModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const LegendModal: React.FC<LegendModalProps> = ({ isOpen, onClose }) => {
    // IMPORTANT: This content must list the Source of Truth from `dashboard_logic_guide.md`.
    // If parsing logic changes in `src/utils/parser.ts`, update these definitions immediately.
    const [activeTab, setActiveTab] = useState<'definitions' | 'metrics' | 'categories'>('definitions');

    if (!isOpen) return null;

    const definitions = [
        {
            term: "YES",
            description: "Criteria is fully met (Explicit 'Yes' in data).",
            icon: <CheckCircle className="w-5 h-5 text-green-500" />,
            bg: "bg-green-50 dark:bg-green-500/10",
            border: "border-green-200 dark:border-green-500/20"
        },
        {
            term: "NO",
            description: "Criteria has not been met (Explicit 'No' in data).",
            icon: <AlertCircle className="w-5 h-5 text-red-500" />,
            bg: "bg-red-50 dark:bg-red-500/10",
            border: "border-red-200 dark:border-red-500/20"
        },
        {
            term: "TBD",
            description: "Pending evaluation (To Be Determined).",
            icon: <HelpCircle className="w-5 h-5 text-yellow-500" />,
            bg: "bg-yellow-50 dark:bg-yellow-500/10",
            border: "border-yellow-200 dark:border-yellow-500/20"
        },
        {
            term: "N/A",
            description: "Not Applicable for this specific project.",
            icon: <MinusCircle className="w-5 h-5 text-gray-400" />,
            bg: "bg-gray-50 dark:bg-gray-800",
            border: "border-gray-200 dark:border-gray-700"
        },
        {
            term: "Empty Cell",
            description: "No information currently available.",
            icon: <div className="w-5 h-5 border-2 border-dashed border-gray-300 rounded-full" />,
            bg: "bg-white dark:bg-[#1e1e1e]",
            border: "border-gray-200 dark:border-white/10"
        },
        {
            term: "2026",
            description: "Compliance expected by 2026.",
            icon: <Clock className="w-5 h-5 text-blue-500" />,
            bg: "bg-blue-50 dark:bg-blue-500/10",
            border: "border-blue-200 dark:border-blue-500/20"
        }
    ];

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden border border-gray-200 dark:border-white/10"
                >
                    {/* Header */}
                    <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-[#1e1e1e]">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <BookOpen className="w-6 h-6 text-blue-500" />
                                Dashboard Logic & Definitions
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Understanding data sources, metrics, and variables
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 transition-colors text-gray-500"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex border-b border-gray-200 dark:border-white/10 px-6">
                        <button
                            onClick={() => setActiveTab('definitions')}
                            className={`flex items-center gap-2 py-4 px-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'definitions'
                                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                                }`}
                        >
                            <List size={16} />
                            Status Definitions
                        </button>
                        <button
                            onClick={() => setActiveTab('metrics')}
                            className={`flex items-center gap-2 py-4 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'metrics'
                                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                                }`}
                        >
                            <Ruler size={16} />
                            Metric Rules
                        </button>
                        <button
                            onClick={() => setActiveTab('categories')}
                            className={`flex items-center gap-2 py-4 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'categories'
                                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                                }`}
                        >
                            <Layers size={16} />
                            Categorization
                        </button>
                    </div>

                    {/* Scrollable Content */}
                    <div className="p-6 overflow-y-auto custom-scrollbar">

                        {/* Tab: Status Definitions */}
                        {activeTab === 'definitions' && (
                            <div className="space-y-3">
                                <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-xl border border-gray-100 dark:border-white/10 mb-6">
                                    <h4 className="font-bold text-gray-900 dark:text-white mb-2">Dashboard Purpose</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                        This dashboard tracks the studio's progress toward the <strong>AIA 2030 Commitment</strong> and sustainability goals.
                                        It provides actionable insights on Energy, Water, and Carbon to help teams measure impact and drive design excellence.
                                    </p>
                                </div>
                                <div className="prose dark:prose-invert max-w-none mb-4">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        These status indicators are used throughout the dashboard to represent the state of various goals and potential compliance.
                                    </p>
                                </div>
                                {definitions.map((def, idx) => (
                                    <motion.div
                                        key={def.term}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className={`flex items-center gap-4 p-4 rounded-xl border ${def.bg} ${def.border}`}
                                    >
                                        <div className="flex-shrink-0">
                                            {def.icon}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                                                {def.term}
                                            </h4>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {def.description}
                                            </p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}

                        {/* Tab: Metric Rules */}
                        {activeTab === 'metrics' && (
                            <div className="space-y-6 text-sm text-gray-700 dark:text-gray-300">
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30">
                                    <h4 className="font-bold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                                        <CheckCircle size={16} />
                                        Priority Rule
                                    </h4>
                                    <p>
                                        For most metrics, the dashboard prioritized <strong>Explicit Columns</strong> over calculated values.
                                        If a column like "Meets 2030" or "Water Commitment" says "Yes" or "No", that value is used regardless of the underlying data numbers.
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <div className="border-b border-gray-100 dark:border-white/5 pb-4">
                                        <h4 className="font-bold text-gray-900 dark:text-white mb-1">Meeting 2030 EUI Goal</h4>
                                        <ul className="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
                                            <li><strong>Primary Check:</strong> Looks for column "Meet 2030" or "2030 Goal". Uses Yes/No value.</li>
                                            <li><strong>Calculation Fallback:</strong> (Baseline EUI - Predicted EUI) / Baseline EUI ≥ 80%.</li>
                                            <li><strong>Missing Data:</strong> Empty cells for Predicted EUI are treated as missing (0% reduction), NOT as Net Zero (100% reduction).</li>
                                        </ul>
                                    </div>

                                    <div className="border-b border-gray-100 dark:border-white/5 pb-4">
                                        <h4 className="font-bold text-gray-900 dark:text-white mb-1">Meeting Indoor Water Goal</h4>
                                        <ul className="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
                                            <li><strong>Primary Check:</strong> Looks for column "Meets indoor Water Commitment", "Water Commitment", or similar.</li>
                                            <li><strong>Calculation Fallback:</strong> Indoor Water Use Reduction ≥ 40%.</li>
                                        </ul>
                                    </div>

                                    <div>
                                        <h4 className="font-bold text-gray-900 dark:text-white mb-1">Other Metric Targets</h4>
                                        <ul className="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
                                            <li><strong>Outdoor Water:</strong> Priority Check: "Meets PW Outdoor Water Commitment" (Yes/No). Fallback: Reduction &gt; 50%.</li>
                                            <li><strong>LPD 2030 Goal:</strong> Must be <strong>Eligible</strong>. Check: "Meet 2030 LPD" (Yes/No). Fallback: &ge; 25%.</li>
                                            <li><strong>Embodied Carbon:</strong> Tracks if pathway is defined (not "N/A", "TBD", or "No").</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tab: Categorization */}
                        {activeTab === 'categories' && (
                            <div className="space-y-6 text-sm text-gray-700 dark:text-gray-300">
                                <div className="border-b border-gray-100 dark:border-white/5 pb-4">
                                    <h4 className="font-bold text-gray-900 dark:text-white mb-2">Project Sectors</h4>
                                    <p className="mb-2">The dashboard attempts to identify the sector in the following order:</p>
                                    <ol className="list-decimal pl-5 space-y-1 text-gray-600 dark:text-gray-400">
                                        <li><strong>Sector Column:</strong> Explicit value in the "Sector" column.</li>
                                        <li><strong>Name Detection:</strong> Keywords in the Project Name (e.g., "School" -&gt; K12, "HCA" -&gt; Healthcare HCA).</li>
                                    </ol>
                                </div>

                                <div>
                                    <h4 className="font-bold text-gray-900 dark:text-white mb-2">Architecture vs. Interiors</h4>
                                    <p className="mb-2">Determined by the <strong>"Arch vs Int"</strong> column:</p>
                                    <ul className="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
                                        <li><strong>Architecture:</strong> "A", "Architecture" (case-insensitive).</li>
                                        <li><strong>Interiors:</strong> "I", "Interiors" (case-insensitive).</li>
                                        <li><strong>Unknown:</strong> Any other value (not displayed in specific overview panels).</li>
                                    </ul>
                                </div>
                            </div>
                        )}

                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
