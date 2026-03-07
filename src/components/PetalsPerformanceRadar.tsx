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

    const CHART_COLORS = ["#22c55e", "#3b82f6", "#a855f7", "#f59e0b", "#ef4444"];

    const { data, activeYears } = useMemo(() => {
        if (projects.length === 0) return { data: [], activeYears: [] };

        const yearsSet = new Set(projects.map(p => p.reportingYear));
        const activeYearsArray = Array.from(yearsSet).sort((a, b) => b - a);

        const res: Record<string, any> = {
            poetics: { subject: 'Poetics &\nBeauty', fullMark: 100 },
            conceptual: { subject: 'Conceptual\nClarity', fullMark: 100 },
            research: { subject: 'Research &\nInnovation', fullMark: 100 },
            community: { subject: 'Community &\nInclusion', fullMark: 100 },
            technology: { subject: 'Technology &\nTectonics', fullMark: 100 },
        };

        activeYearsArray.forEach(year => {
            const yearProjects = projects.filter(p => p.reportingYear === year);
            const total = yearProjects.length;

            if (total === 0) return;

            let acc = { poetics: 0, conceptual: 0, research: 0, community: 0, technology: 0 };

            yearProjects.forEach(p => {
                acc.poetics += (p.designPerformance.poeticsBeautyScore || 0) * 100;
                acc.conceptual += (p.designPerformance.conceptualClarityScore || 0) * 100;
                acc.research += (p.designPerformance.researchInnovationScore || 0) * 100;
                acc.community += (p.designPerformance.communityInclusionScore || 0) * 100;
                acc.technology += (p.designPerformance.technologyTectonicsScore || 0) * 100;
            });

            res.poetics[year] = acc.poetics / total;
            res.conceptual[year] = acc.conceptual / total;
            res.research[year] = acc.research / total;
            res.community[year] = acc.community / total;
            res.technology[year] = acc.technology / total;
        });

        const dataArr = [
            res.poetics,
            res.conceptual,
            res.research,
            res.community,
            res.technology
        ];

        return { data: dataArr, activeYears: activeYearsArray };
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

            {/* Legend for active years */}
            {activeYears.length > 1 && (
                <div className="absolute top-6 right-6 flex flex-col gap-1 items-end">
                    {activeYears.map((year, idx) => (
                        <div key={year} className="flex items-center gap-2 text-xs font-medium dark:text-gray-400">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}></span>
                            {year}
                        </div>
                    ))}
                </div>
            )}

            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="65%" data={data}>
                    <PolarGrid stroke={isDark ? "#444" : "#e5e7eb"} />
                    <PolarAngleAxis dataKey="subject" tick={renderCustomTick} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />

                    {activeYears.map((year, idx) => (
                        <Radar
                            key={year}
                            name={year.toString()}
                            dataKey={year.toString()}
                            stroke={CHART_COLORS[idx % CHART_COLORS.length]}
                            strokeWidth={3 - (idx * 0.5) > 1 ? 3 - (idx * 0.5) : 1}
                            fill={CHART_COLORS[idx % CHART_COLORS.length]}
                            fillOpacity={Math.max(0.1, 0.3 - (idx * 0.1))}
                            isAnimationActive={!width}
                        />
                    ))}

                    <Tooltip
                        contentStyle={{
                            backgroundColor: isDark ? '#222' : '#fff',
                            border: isDark ? '1px solid #444' : '1px solid #e5e7eb',
                            color: isDark ? '#fff' : '#111827',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                        formatter={(value: number, name: string) => [`${value.toFixed(1)}%`, `${name} Avg`]}
                    />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
};
