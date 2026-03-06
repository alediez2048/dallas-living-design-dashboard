import { useMemo } from 'react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip } from 'recharts';
import { ProjectMetrics } from '../types';
import { useTheme } from '../context/ThemeContext';

interface PetalsPerformanceRadarProps {
    projects: ProjectMetrics[];
    width?: number;
    height?: number;
}

export const PetalsPerformanceRadar = ({ projects, width, height }: PetalsPerformanceRadarProps) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const data = useMemo(() => {
        if (projects.length === 0) return [];

        const totalProjects = projects.length;

        // Initialize accumulators
        let acc = {
            poetics: 0,
            conceptual: 0,
            research: 0,
            community: 0,
            resilience: 0,
            health: 0,
            technology: 0
        };

        projects.forEach(p => {
            // Scores are 0.0 - 1.0 (or null). Treat null as 0 for coverage.
            // Multiply by 100 for percentage
            acc.poetics += (p.designPerformance.poeticsBeautyScore || 0) * 100;
            acc.conceptual += (p.designPerformance.conceptualClarityScore || 0) * 100;
            acc.research += (p.designPerformance.researchInnovationScore || 0) * 100;
            acc.community += (p.designPerformance.communityInclusionScore || 0) * 100;
            acc.resilience += (p.designPerformance.resilienceRegenerationScore || 0) * 100;
            acc.health += (p.designPerformance.healthWellbeingScore || 0) * 100;
            acc.technology += (p.designPerformance.technologyTectonicsScore || 0) * 100;
        });

        // Create array for Recharts - Ordered clockwise from top
        return [
            { subject: 'Poetics &\nBeauty', A: acc.poetics / totalProjects, fullMark: 100 },
            { subject: 'Conceptual\nClarity', A: acc.conceptual / totalProjects, fullMark: 100 },
            { subject: 'Research &\nInnovation', A: acc.research / totalProjects, fullMark: 100 },
            { subject: 'Community &\nInclusion', A: acc.community / totalProjects, fullMark: 100 },
            { subject: 'Technology &\nTectonics', A: acc.technology / totalProjects, fullMark: 100 },
        ];
    }, [projects]);

    const renderCustomTick = (props: any) => {
        const { payload, x, y, textAnchor } = props;
        const lines = payload.value.split('\n');
        return (
            <text
                x={x}
                y={y + (lines.length > 1 ? -6 : 0)}
                textAnchor={textAnchor}
                fill={isDark ? '#888' : '#6b7280'}
                fontSize={11}
            >
                {lines.map((line: string, index: number) => (
                    <tspan x={x} dy={index === 0 ? 0 : 14} key={index}>
                        {line}
                    </tspan>
                ))}
            </text>
        );
    };

    return (
        <div
            className={`bg-white dark:bg-[#1e1e1e] rounded-2xl border border-gray-200 dark:border-white/5 p-4 flex flex-col items-center justify-center relative shadow-sm dark:shadow-none transition-colors duration-300 ${width ? '' : 'h-[400px] w-full'}`}
            style={width && height ? { width, height } : undefined}
        >
            <h3 className="text-gray-500 dark:text-gray-400 font-medium absolute top-6 left-6">Petals Performance Average</h3>

            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="65%" data={data}>
                    <PolarGrid stroke={isDark ? "#444" : "#e5e7eb"} />
                    <PolarAngleAxis dataKey="subject" tick={renderCustomTick} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar
                        name="Petals Average"
                        dataKey="A"
                        stroke="#22c55e" // Green-500
                        strokeWidth={3}
                        fill="#22c55e"
                        fillOpacity={0.3}
                        isAnimationActive={!width}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: isDark ? '#222' : '#fff',
                            border: isDark ? '1px solid #444' : '1px solid #e5e7eb',
                            color: isDark ? '#fff' : '#111827',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                        itemStyle={{ color: '#22c55e' }}
                        formatter={(value: number) => `${value.toFixed(1)}%`}
                    />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
};
