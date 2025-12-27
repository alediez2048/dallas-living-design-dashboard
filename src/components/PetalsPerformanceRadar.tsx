import { useMemo } from 'react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip } from 'recharts';
import { ProjectMetrics } from '../types';
import { useTheme } from '../context/ThemeContext';

interface PetalsPerformanceRadarProps {
    projects: ProjectMetrics[];
}

export const PetalsPerformanceRadar = ({ projects }: PetalsPerformanceRadarProps) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const data = useMemo(() => {
        if (projects.length === 0) return [];

        const totalProjects = projects.length;

        // Initialize accumulators
        let acc = {
            conceptual: 0,
            research: 0,
            technology: 0,
            community: 0
        };

        projects.forEach(p => {
            // Scores are 0.0 - 1.0 (or null). Treat null as 0 for coverage.
            // Multiply by 100 for percentage
            acc.conceptual += (p.designPerformance.conceptualClarityScore || 0) * 100;
            acc.research += (p.designPerformance.researchInnovationScore || 0) * 100;
            acc.technology += (p.designPerformance.technologyTectonicsScore || 0) * 100;
            acc.community += (p.designPerformance.communityInclusionScore || 0) * 100;
        });

        // Create array for Recharts
        return [
            { subject: 'Conceptual', A: acc.conceptual / totalProjects, fullMark: 100 },
            { subject: 'Research', A: acc.research / totalProjects, fullMark: 100 },
            { subject: 'Technology', A: acc.technology / totalProjects, fullMark: 100 },
            { subject: 'Community', A: acc.community / totalProjects, fullMark: 100 },
        ];
    }, [projects]);

    return (
        <div className="h-[400px] w-full bg-white dark:bg-[#1e1e1e] rounded-2xl border border-gray-200 dark:border-white/5 p-4 flex flex-col items-center justify-center relative shadow-sm dark:shadow-none transition-colors duration-300">
            <h3 className="text-gray-500 dark:text-gray-400 font-medium absolute top-6 left-6">Petals Performance Average</h3>

            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                    <PolarGrid stroke={isDark ? "#444" : "#e5e7eb"} />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: isDark ? '#888' : '#6b7280', fontSize: 12 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar
                        name="Petals Average"
                        dataKey="A"
                        stroke="#8b5cf6" // Purple/Violet
                        strokeWidth={3}
                        fill="#8b5cf6"
                        fillOpacity={0.3}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: isDark ? '#222' : '#fff',
                            border: isDark ? '1px solid #444' : '1px solid #e5e7eb',
                            color: isDark ? '#fff' : '#111827',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                        itemStyle={{ color: '#8b5cf6' }}
                    />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
};
