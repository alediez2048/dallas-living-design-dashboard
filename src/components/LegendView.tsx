import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, HelpCircle, MinusCircle, Clock, BookOpen, Ruler, Layers, List, Flower2 } from 'lucide-react';
import livingDesignFlower from '/living-design-flower.png?url';

export const LegendView: React.FC = () => {
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

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.05 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8 md:space-y-12 lg:space-y-16"
        >
            {/* Header */}
            <motion.div variants={itemVariants}>
                <div className="flex items-center gap-3 mb-2">
                    <BookOpen className="w-6 h-6 md:w-8 md:h-8 text-blue-500" />
                    <h1 className="text-2xl md:text-3xl xl:text-4xl font-bold text-gray-900 dark:text-white">
                        Dashboard Logic & Definitions
                    </h1>
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-base md:text-lg xl:text-xl">
                    Understanding data sources, metrics, and variables used throughout the dashboard.
                </p>
            </motion.div>

            {/* Living Design Framework Section */}
            <motion.section variants={itemVariants} id="living-design-framework">
                <div className="flex items-center gap-2 mb-4 md:mb-6">
                    <Flower2 className="w-5 h-5 md:w-6 md:h-6 text-green-500" />
                    <h2 className="text-lg md:text-xl xl:text-2xl font-bold text-gray-900 dark:text-white">
                        Living Design Framework
                    </h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 items-center">
                    {/* Flower Image - shows first on mobile, right side on desktop */}
                    <div className="flex justify-center lg:order-2">
                        <div className="bg-white dark:bg-[#1e1e1e] p-4 md:p-6 rounded-2xl border border-gray-200 dark:border-white/10">
                            <img
                                src={livingDesignFlower}
                                alt="Living Design Framework - 7 petals representing Poetics & Beauty, Conceptual Clarity, Research & Innovation, Technology & Tectonics, Community & Inclusion, Resilience & Regeneration, and Health & Well-Being"
                                className="w-full max-w-[600px] md:max-w-[720px] h-auto"
                            />
                        </div>
                    </div>

                    {/* Dashboard Purpose & Eligibility - shows second on mobile, left side on desktop */}
                    <div className="space-y-4 md:space-y-6 lg:order-1">
                        <div className="bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 p-4 md:p-6 rounded-2xl border border-green-100 dark:border-green-900/30">
                            <h4 className="font-bold text-gray-900 dark:text-white mb-2 text-base md:text-lg">Dashboard Purpose</h4>
                            <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                                This dashboard tracks the studio's progress toward <strong>Perkins and Will Living Design Standards</strong> and <strong>AIA 2030 Commitment</strong>.
                                It provides actionable insights on Energy, Water, Materials and Carbon to help teams measure impact and drive design excellence.
                            </p>
                        </div>

                        <div className="bg-white dark:bg-[#1e1e1e] p-4 md:p-6 rounded-2xl border border-gray-200 dark:border-white/10">
                            <h4 className="font-bold text-gray-900 dark:text-white mb-3 text-base md:text-lg">Baseline Eligibility</h4>

                            <div className="space-y-3 text-xs md:text-sm text-gray-600 dark:text-gray-400">
                                <div>
                                    <p className="font-semibold text-green-600 dark:text-green-400">Architecture/Interiors/Branded Environments</p>
                                    <ul className="list-disc pl-4 mt-1 space-y-1">
                                        <li>Contractual Phases completed in <strong>2025</strong> (SD, DD, or CD)</li>
                                        <li>Project Hours: 320+ labor hours</li>
                                        <li>Project Size: 1,500+ SF/140+ SM</li>
                                    </ul>
                                </div>

                                <div>
                                    <p className="font-semibold text-green-600 dark:text-green-400">Landscape</p>
                                    <ul className="list-disc pl-4 mt-1 space-y-1">
                                        <li>Contractual Phases completed in <strong>2025</strong> (SD, DD, or CD)</li>
                                        <li>Project Hours: 320+ labor hours</li>
                                        <li>Project Size: 15,000+ SF/1400+ SM</li>
                                    </ul>
                                </div>

                                <div>
                                    <p className="font-semibold text-green-600 dark:text-green-400">Urban Design</p>
                                    <ul className="list-disc pl-4 mt-1 space-y-1">
                                        <li>Project Hours: 320+ labor hours</li>
                                        <li>Note: Policy-type documents not required to respond to Design Drivers</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </motion.section>

            {/* Section: Status Definitions */}
            <motion.section variants={itemVariants} id="status-definitions">
                <div className="flex items-center gap-2 mb-4 md:mb-6">
                    <List className="w-5 h-5 md:w-6 md:h-6 text-purple-500" />
                    <h2 className="text-lg md:text-xl xl:text-2xl font-bold text-gray-900 dark:text-white">
                        Status Definitions
                    </h2>
                </div>

                <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mb-4 md:mb-6">
                    These status indicators are used throughout the dashboard to represent the state of various goals and potential compliance.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4">
                    {definitions.map((def) => (
                        <motion.div
                            key={def.term}
                            variants={itemVariants}
                            className={`flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl border ${def.bg} ${def.border} hover:scale-[1.02] transition-transform`}
                        >
                            <div className="flex-shrink-0">
                                {def.icon}
                            </div>
                            <div>
                                <h4 className="font-bold text-sm md:text-base text-gray-900 dark:text-white">
                                    {def.term}
                                </h4>
                                <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                                    {def.description}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </motion.section>

            {/* Section: PW Targets */}
            <motion.section variants={itemVariants} id="pw-targets">
                <div className="flex items-center gap-2 mb-4 md:mb-6">
                    <Ruler className="w-5 h-5 md:w-6 md:h-6 text-green-500" />
                    <h2 className="text-lg md:text-xl xl:text-2xl font-bold text-gray-900 dark:text-white">
                        PW Targets
                    </h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                    <div className="p-4 md:p-5 xl:p-6 rounded-xl bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-white/10">
                        <h4 className="font-bold text-gray-900 dark:text-white mb-2 text-base md:text-lg">Meeting 2030 EUI Goal</h4>
                        <ul className="list-disc pl-5 space-y-1 text-xs md:text-sm text-gray-600 dark:text-gray-400">
                            <li>80% EUI Reduction target</li>
                            <li>25% LPD Reduction target</li>
                        </ul>
                    </div>

                    <div className="p-4 md:p-5 xl:p-6 rounded-xl bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-white/10">
                        <h4 className="font-bold text-gray-900 dark:text-white mb-2 text-base md:text-lg">Water</h4>
                        <ul className="list-disc pl-5 space-y-1 text-xs md:text-sm text-gray-600 dark:text-gray-400">
                            <li>40% Indoor water reduction target</li>
                            <li>30% Outdoor water reduction target</li>
                        </ul>
                    </div>
                </div>
            </motion.section>



            {/* Bottom Spacer */}
            <div className="h-8" />
        </motion.div>
    );
};

