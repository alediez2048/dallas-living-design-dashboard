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
                <div className="flex justify-between items-end mb-8 border-b-2 border-gray-800 pb-4">
                    <h1 className="text-4xl font-bold uppercase tracking-tight text-gray-900">{title}</h1>
                    <div className="text-right">
                        <span className="block text-sm text-gray-500 font-medium">Living Design Dashboard Report</span>
                        <span className="block text-xs text-gray-400">{new Date().toLocaleDateString()}</span>
                    </div>
                </div>

                {/* Main Metrics */}
                <div className="grid grid-cols-4 gap-6 mb-12 h-32">
                    <MetricCard
                        label="Total Projects"
                        projects={projects}
                        color="from-blue-600 to-teal-500"
                        onClick={() => { }}
                    />
                    <MetricCard
                        label="Eligible Projects"
                        projects={eligibleProjects}
                        total={projects.length}
                        color="from-green-600 to-emerald-500"
                        onClick={() => { }}
                    />
                    <div className="col-span-2"></div>
                </div>

                {/* Breakdowns */}
                <div className="grid grid-cols-2 gap-12">
                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 h-64 flex flex-col justify-center">
                        <h4 className="text-lg font-bold mb-6 uppercase text-gray-500 tracking-wider">Architecture Overview</h4>
                        <div className="grid grid-cols-2 gap-6 h-32">
                            <MetricCard label="Total Arch" projects={archProjects} color="from-orange-500 to-red-500" onClick={() => { }} />
                            <MetricCard label="Eligible Arch" projects={eligibleArch} total={archProjects.length} color="from-orange-400 to-pink-500" onClick={() => { }} />
                        </div>
                    </div>

                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 h-64 flex flex-col justify-center">
                        <h4 className="text-lg font-bold mb-6 uppercase text-gray-500 tracking-wider">Interiors Overview</h4>
                        <div className="grid grid-cols-2 gap-6 h-32">
                            <MetricCard label="Total Int" projects={intProjects} color="from-purple-500 to-indigo-500" onClick={() => { }} />
                            <MetricCard label="Eligible Int" projects={eligibleInt} total={intProjects.length} color="from-purple-400 to-blue-500" onClick={() => { }} />
                        </div>
                    </div>
                </div>

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
