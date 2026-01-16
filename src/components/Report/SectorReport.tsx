import { ProjectMetrics } from '../../types';
import { PetalsPerformanceRadar } from '../PetalsPerformanceRadar';
import { PetalRadar } from '../PetalRadar';
import { MetricCard } from '../MetricCard';
import { ThemeContext } from '../../context/ThemeContext';

interface SectorReportProps {
    title: string;
    projects: ProjectMetrics[];
}

export const SectorReport = ({ title, projects }: SectorReportProps) => {
    // Filter Eligible
    const eligibleProjects = projects.filter(p => p.isEligible);

    // Breakdown Metrics
    const archProjects = projects.filter(p => p.archVsInt === 'Architecture');
    const eligibleArch = archProjects.filter(p => p.isEligible);

    const intProjects = projects.filter(p => p.archVsInt === 'Interiors');
    const eligibleInt = intProjects.filter(p => p.isEligible);

    // Force Light Theme for Print
    const lightThemeContext = {
        theme: 'light' as const,
        toggleTheme: () => { }
    };

    return (
        <ThemeContext.Provider value={lightThemeContext}>
            {/* PAGE 1: METRICS OVERVIEW */}
            <div className="w-full h-screen p-12 flex flex-col bg-white text-black print:block relative" style={{ pageBreakAfter: 'always' }}>
                {/* Header */}
                <div className="flex justify-between items-end mb-6 border-b-2 border-gray-800 pb-4">
                    <h1 className="text-4xl font-bold uppercase tracking-tight text-gray-900">{title}</h1>
                    <div className="text-right">
                        <span className="block text-sm text-gray-500 font-medium">Living Design Dashboard Report</span>
                        <span className="block text-xs text-gray-400">{new Date().toLocaleDateString()}</span>
                    </div>
                </div>

                {/* Main Metrics */}
                <div className="grid grid-cols-4 gap-4 mb-6 h-28">
                    <MetricCard
                        label="Total Projects"
                        projects={projects}
                        color="from-blue-600 to-teal-500"
                        onClick={() => { }}
                    />
                    <MetricCard
                        label="Eligible Projects"
                        projects={eligibleProjects}
                        color="from-green-600 to-emerald-500"
                        onClick={() => { }}
                    />
                    <div className="col-span-2"></div>
                </div>

                {/* Architecture & Interiors Breakdowns */}
                <div className="grid grid-cols-2 gap-6 mb-6">
                    {archProjects.length > 0 && (
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <h4 className="text-sm font-bold mb-3 uppercase text-purple-600 tracking-wider">Architecture Overview</h4>
                            <div className="grid grid-cols-2 gap-3 h-24 mb-3">
                                <MetricCard label="Total Arch" projects={archProjects} color="from-purple-600 to-purple-400" onClick={() => { }} compact />
                                <MetricCard label="Eligible" projects={eligibleArch} color="from-purple-500 to-purple-300" onClick={() => { }} compact />
                            </div>
                            {/* Architecture Metrics Row */}
                            <div className="grid grid-cols-5 gap-2 h-20">
                                <MetricCard label="EUI" projects={eligibleArch.filter(p => p.resilience.meets2030Goal)} total={eligibleArch.length} color="from-purple-500 to-purple-400" onClick={() => { }} compact />
                                <MetricCard label="In. H2O" projects={eligibleArch.filter(p => p.resilience.meetsWaterGoal)} total={eligibleArch.length} color="from-purple-500 to-purple-400" onClick={() => { }} compact />
                                <MetricCard label="Out. H2O" projects={eligibleArch.filter(p => p.resilience.meetsOutdoorWaterGoal)} total={eligibleArch.length} color="from-purple-500 to-purple-400" onClick={() => { }} compact />
                                <MetricCard label="Switch" projects={eligibleArch.filter(p => p.health.switchListVetted)} total={eligibleArch.length} color="from-purple-500 to-purple-400" onClick={() => { }} compact />
                                <MetricCard label="Emb. C" projects={eligibleArch.filter(p => p.resilience.embodiedCarbonPathway !== 'N/A' && p.resilience.embodiedCarbonPathway !== 'TBD' && p.resilience.embodiedCarbonPathway.toLowerCase() !== 'no')} total={eligibleArch.length} color="from-purple-500 to-purple-400" onClick={() => { }} compact />
                            </div>
                        </div>
                    )}

                    {intProjects.length > 0 && (
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <h4 className="text-sm font-bold mb-3 uppercase text-teal-600 tracking-wider">Interiors Overview</h4>
                            <div className="grid grid-cols-2 gap-3 h-24 mb-3">
                                <MetricCard label="Total Int" projects={intProjects} color="from-teal-600 to-teal-400" onClick={() => { }} compact />
                                <MetricCard label="Eligible" projects={eligibleInt} color="from-teal-500 to-teal-300" onClick={() => { }} compact />
                            </div>
                            {/* Interiors Metrics Row */}
                            <div className="grid grid-cols-4 gap-2 h-20">
                                <MetricCard label="LPD" projects={eligibleInt.filter(p => p.resilience.meetsLpdGoal)} total={eligibleInt.length} color="from-teal-500 to-teal-400" onClick={() => { }} compact />
                                <MetricCard label="In. H2O" projects={eligibleInt.filter(p => p.resilience.meetsWaterGoal)} total={eligibleInt.length} color="from-teal-500 to-teal-400" onClick={() => { }} compact />
                                <MetricCard label="Switch" projects={eligibleInt.filter(p => p.health.switchListVetted)} total={eligibleInt.length} color="from-teal-500 to-teal-400" onClick={() => { }} compact />
                                <MetricCard label="Emb. C" projects={eligibleInt.filter(p => p.resilience.embodiedCarbonPathway !== 'N/A' && p.resilience.embodiedCarbonPathway !== 'TBD' && p.resilience.embodiedCarbonPathway.toLowerCase() !== 'no')} total={eligibleInt.length} color="from-teal-500 to-teal-400" onClick={() => { }} compact />
                            </div>
                        </div>
                    )}
                </div>

                {/* EUI Guidance Levels (Architecture Only) */}
                {archProjects.length > 0 && (
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <h4 className="text-sm font-bold mb-3 uppercase text-gray-600 tracking-wider">EUI Guidance Levels (Architecture)</h4>
                        <div className="grid grid-cols-5 gap-3 h-20">
                            <MetricCard label="Level 1 (Nat'l Avg)" projects={eligibleArch.filter(p => p.euiGuidanceLevel === 1)} total={eligibleArch.length} color="from-red-500 to-red-400" onClick={() => { }} compact />
                            <MetricCard label="Level 2 (BAU)" projects={eligibleArch.filter(p => p.euiGuidanceLevel === 2)} total={eligibleArch.length} color="from-orange-500 to-orange-400" onClick={() => { }} compact />
                            <MetricCard label="Level 3 (Baseline)" projects={eligibleArch.filter(p => p.euiGuidanceLevel === 3)} total={eligibleArch.length} color="from-yellow-500 to-yellow-400" onClick={() => { }} compact />
                            <MetricCard label="Level 4 (Good)" projects={eligibleArch.filter(p => p.euiGuidanceLevel === 4)} total={eligibleArch.length} color="from-lime-500 to-lime-400" onClick={() => { }} compact />
                            <MetricCard label="Level 5 (Excellent)" projects={eligibleArch.filter(p => p.euiGuidanceLevel === 5)} total={eligibleArch.length} color="from-green-500 to-green-400" onClick={() => { }} compact />
                        </div>
                    </div>
                )}

                {/* Footer Page 1 */}
                <div className="absolute bottom-8 left-0 w-full text-center text-xs text-gray-400">
                    Page 1: Overview
                </div>
            </div>

            {/* PAGE 2: RADAR GRAPHS */}
            <div className="w-full h-screen p-12 flex flex-col bg-white text-black print:block relative" style={{ pageBreakAfter: 'always' }}>
                {/* Minimal Header */}
                <div className="flex justify-between items-end mb-8 border-b border-gray-200 pb-2">
                    <h2 className="text-2xl font-bold uppercase text-gray-600">{title} - Performance</h2>
                </div>

                {/* Graphs Centered */}
                <div className="flex-1 flex items-center justify-center gap-12">
                    <div className="flex flex-col items-center gap-4">
                        <h3 className="text-xl font-bold text-gray-800">Petals Performance</h3>
                        <div className="border border-gray-100 rounded-2xl p-6 bg-white shadow-sm">
                            <PetalsPerformanceRadar projects={eligibleProjects} width={500} height={500} />
                        </div>
                    </div>

                    <div className="flex flex-col items-center gap-4">
                        <h3 className="text-xl font-bold text-gray-800">Studio Performance</h3>
                        <div className="border border-gray-100 rounded-2xl p-6 bg-white shadow-sm">
                            <PetalRadar projects={eligibleProjects} width={500} height={500} />
                        </div>
                    </div>
                </div>

                {/* Footer Page 2 */}
                <div className="absolute bottom-8 left-0 w-full text-center text-xs text-gray-400">
                    Page 2: Performance Graphs
                </div>
            </div>
        </ThemeContext.Provider>
    );
};
