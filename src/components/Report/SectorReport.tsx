import { ProjectMetrics } from '../../types';
import { PetalsPerformanceRadar } from '../PetalsPerformanceRadar';
import { PetalRadar } from '../PetalRadar';
import { PrintMetricCard } from './PrintMetricCard';
import { ThemeContext } from '../../context/ThemeContext';

interface SectorReportProps {
    title: string;
    projects: ProjectMetrics[];
}

export const SectorReport = ({ title, projects }: SectorReportProps) => {
    // Filter Eligible
    const eligibleProjects = projects.filter(p => p.isEligible);

    // Breakdown Metrics — filter by archVsInt
    const archProjects = projects.filter(p => p.archVsInt === 'Architecture');
    const eligibleArch = archProjects.filter(p => p.isEligible);

    const intProjects = projects.filter(p => p.archVsInt === 'Interiors');
    const eligibleInt = intProjects.filter(p => p.isEligible);

    // When archVsInt is not available (column not found in Excel), 
    // fall back to showing all projects as a combined group
    const hasArchIntSplit = archProjects.length > 0 || intProjects.length > 0;
    // For EUI guidance: use arch projects when available, otherwise all eligible
    const euiProjects = archProjects.length > 0 ? archProjects : projects;
    const eligibleForEui = euiProjects.filter(p => p.isEligible);

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
                    <PrintMetricCard
                        label="Total Projects"
                        projects={projects}
                        color="from-blue-600 to-teal-500"
                    />
                    <PrintMetricCard
                        label="Eligible Projects"
                        projects={eligibleProjects}
                        color="from-green-600 to-emerald-500"
                    />
                    <div className="col-span-2"></div>
                </div>

                {/* Architecture & Interiors Breakdowns */}
                <div className="grid grid-cols-2 gap-6 mb-6">
                    {hasArchIntSplit ? (
                        <>
                            {archProjects.length > 0 && (
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <h4 className="text-sm font-bold mb-3 uppercase text-purple-600 tracking-wider">Architecture Overview</h4>
                                    <div className="grid grid-cols-2 gap-3 h-24 mb-3">
                                        <PrintMetricCard label="Total Arch" projects={archProjects} color="from-purple-600 to-purple-400" onClick={() => { }} compact />
                                        <PrintMetricCard label="Eligible" projects={eligibleArch} color="from-purple-500 to-purple-300" onClick={() => { }} compact />
                                    </div>
                                    {/* Architecture Metrics Row */}
                                    <div className="grid grid-cols-5 gap-2 h-20">
                                        <PrintMetricCard label="EUI" projects={eligibleArch.filter(p => p.resilience.meets2030Goal)} total={eligibleArch.length} color="from-purple-500 to-purple-400" onClick={() => { }} compact />
                                        <PrintMetricCard label="In. H2O" projects={eligibleArch.filter(p => p.resilience.meetsWaterGoal)} total={eligibleArch.length} color="from-purple-500 to-purple-400" onClick={() => { }} compact />
                                        <PrintMetricCard label="Out. H2O" projects={eligibleArch.filter(p => p.resilience.meetsOutdoorWaterGoal)} total={eligibleArch.length} color="from-purple-500 to-purple-400" onClick={() => { }} compact />
                                        <PrintMetricCard label="Switch" projects={eligibleArch.filter(p => p.health.switchListVetted)} total={eligibleArch.length} color="from-purple-500 to-purple-400" onClick={() => { }} compact />
                                        <PrintMetricCard label="Emb. C" projects={eligibleArch.filter(p => p.resilience.embodiedCarbonPathway !== 'N/A' && p.resilience.embodiedCarbonPathway !== 'TBD' && p.resilience.embodiedCarbonPathway.toLowerCase() !== 'no')} total={eligibleArch.length} color="from-purple-500 to-purple-400" onClick={() => { }} compact />
                                    </div>
                                </div>
                            )}

                            {intProjects.length > 0 && (
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <h4 className="text-sm font-bold mb-3 uppercase text-teal-600 tracking-wider">Interiors Overview</h4>
                                    <div className="grid grid-cols-2 gap-3 h-24 mb-3">
                                        <PrintMetricCard label="Total Int" projects={intProjects} color="from-teal-600 to-teal-400" onClick={() => { }} compact />
                                        <PrintMetricCard label="Eligible" projects={eligibleInt} color="from-teal-500 to-teal-300" onClick={() => { }} compact />
                                    </div>
                                    {/* Interiors Metrics Row */}
                                    <div className="grid grid-cols-4 gap-2 h-20">
                                        <PrintMetricCard label="LPD" projects={eligibleInt.filter(p => p.resilience.meetsLpdGoal)} total={eligibleInt.length} color="from-teal-500 to-teal-400" onClick={() => { }} compact />
                                        <PrintMetricCard label="In. H2O" projects={eligibleInt.filter(p => p.resilience.meetsWaterGoal)} total={eligibleInt.length} color="from-teal-500 to-teal-400" onClick={() => { }} compact />
                                        <PrintMetricCard label="Switch" projects={eligibleInt.filter(p => p.health.switchListVetted)} total={eligibleInt.length} color="from-teal-500 to-teal-400" onClick={() => { }} compact />
                                        <PrintMetricCard label="Emb. C" projects={eligibleInt.filter(p => p.resilience.embodiedCarbonPathway !== 'N/A' && p.resilience.embodiedCarbonPathway !== 'TBD' && p.resilience.embodiedCarbonPathway.toLowerCase() !== 'no')} total={eligibleInt.length} color="from-teal-500 to-teal-400" onClick={() => { }} compact />
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        /* Fallback: show a combined overview when arch/int split is not available */
                        <div className="col-span-2 bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <h4 className="text-sm font-bold mb-3 uppercase text-blue-600 tracking-wider">All Projects Overview</h4>
                            <div className="grid grid-cols-5 gap-3 h-24 mb-3">
                                <PrintMetricCard label="Total" projects={projects} color="from-blue-600 to-blue-400" onClick={() => { }} compact />
                                <PrintMetricCard label="Eligible" projects={eligibleProjects} color="from-green-600 to-green-400" onClick={() => { }} compact />
                                <PrintMetricCard label="EUI Goal" projects={eligibleProjects.filter(p => p.resilience.meets2030Goal)} total={eligibleProjects.length} color="from-purple-500 to-purple-400" onClick={() => { }} compact />
                                <PrintMetricCard label="In. H2O" projects={eligibleProjects.filter(p => p.resilience.meetsWaterGoal)} total={eligibleProjects.length} color="from-blue-500 to-blue-400" onClick={() => { }} compact />
                                <PrintMetricCard label="Switch" projects={eligibleProjects.filter(p => p.health.switchListVetted)} total={eligibleProjects.length} color="from-teal-500 to-teal-400" onClick={() => { }} compact />
                            </div>
                            <p className="text-xs text-gray-400 italic mt-1">Architecture/Interiors split not available — add an "Arch vs Int" column to your spreadsheet to enable separate breakdowns.</p>
                        </div>
                    )}
                </div>

                {/* EUI Guidance Levels */}
                {eligibleForEui.length > 0 && (
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <h4 className="text-sm font-bold mb-3 uppercase text-gray-600 tracking-wider">
                            EUI Guidance Levels {hasArchIntSplit ? '(Architecture)' : '(All Eligible)'}
                        </h4>
                        <div className="grid grid-cols-5 gap-3 h-20">
                            <PrintMetricCard label="Level 1 (Nat'l Avg)" projects={eligibleForEui.filter(p => p.euiGuidanceLevel === 1)} total={eligibleForEui.length} color="from-red-500 to-red-400" onClick={() => { }} compact />
                            <PrintMetricCard label="Level 2 (BAU)" projects={eligibleForEui.filter(p => p.euiGuidanceLevel === 2)} total={eligibleForEui.length} color="from-orange-500 to-orange-400" onClick={() => { }} compact />
                            <PrintMetricCard label="Level 3 (Baseline)" projects={eligibleForEui.filter(p => p.euiGuidanceLevel === 3)} total={eligibleForEui.length} color="from-yellow-500 to-yellow-400" onClick={() => { }} compact />
                            <PrintMetricCard label="Level 4 (Good)" projects={eligibleForEui.filter(p => p.euiGuidanceLevel === 4)} total={eligibleForEui.length} color="from-lime-500 to-lime-400" onClick={() => { }} compact />
                            <PrintMetricCard label="Level 5 (Excellent)" projects={eligibleForEui.filter(p => p.euiGuidanceLevel === 5)} total={eligibleForEui.length} color="from-green-500 to-green-400" onClick={() => { }} compact />
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
