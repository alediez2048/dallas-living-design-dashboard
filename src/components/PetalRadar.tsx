import { useMemo } from 'react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip, Legend } from 'recharts';
import { ProjectMetrics } from '../types';
import { useTheme } from '../context/ThemeContext';

interface PetalRadarProps {
    projects: ProjectMetrics[];
    width?: number;
    height?: number;
}

export const PetalRadar = ({ projects, width, height }: PetalRadarProps) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const CHART_COLORS = ["#3b82f6", "#22c55e", "#a855f7", "#f59e0b", "#ef4444"];

    const { data, activeYears } = useMemo(() => {
        if (projects.length === 0) return { data: [], activeYears: [] };

        const yearsSet = new Set(projects.map(p => p.reportingYear));
        const activeYearsArray = Array.from(yearsSet).sort((a, b) => b - a);

        const res: Record<string, any> = {
            ecology: { subject: 'Ecology', fullMark: 100 },
            resilience: { subject: 'Resilience', fullMark: 100 },
            air: { subject: 'Air', fullMark: 100 },
            light: { subject: 'Light', fullMark: 100 },
            thermal: { subject: 'Thermal', fullMark: 100 },
            acoustic: { subject: 'Acoustic', fullMark: 100 },
            biophilia: { subject: 'Biophilia', fullMark: 100 },
        };

        activeYearsArray.forEach(year => {
            const yearProjects = projects.filter(p => p.reportingYear === year);
            const total = yearProjects.length;

            if (total === 0) return;

            let acc = {
                ecology: 0,
                resilience: 0,
                air: 0,
                light: 0,
                thermal: 0,
                acoustic: 0,
                biophilia: 0,
            };

            yearProjects.forEach(p => {
                acc.ecology += (p.resilience.ecologyScore / 4) * 100;
                acc.resilience += (p.resilience.resilienceScore / 3) * 100;
                acc.air += (p.health.airScore / 4) * 100;
                acc.light += (p.health.lightScore / 2) * 100;
                acc.thermal += (p.health.thermalComfortScore / 1) * 100;
                acc.acoustic += (p.health.acousticScore / 1) * 100;
                acc.biophilia += (p.health.biophiliaScore / 6) * 100;
            });

            res.ecology[year] = acc.ecology / total;
            res.resilience[year] = acc.resilience / total;
            res.air[year] = acc.air / total;
            res.light[year] = acc.light / total;
            res.thermal[year] = acc.thermal / total;
            res.acoustic[year] = acc.acoustic / total;
            res.biophilia[year] = acc.biophilia / total;
        });

        const dataArr = [
            res.ecology,
            res.resilience,
            res.air,
            res.light,
            res.thermal,
            res.acoustic,
            res.biophilia,
        ];

        return { data: dataArr, activeYears: activeYearsArray };
    }, [projects]);

    return (
        <div
            className={`bg-white dark:bg-[#1e1e1e] rounded-2xl border border-gray-200 dark:border-white/5 p-4 flex flex-col items-center justify-center relative shadow-sm dark:shadow-none transition-colors duration-300 ${width ? '' : 'h-[400px] w-full'}`}
            style={width && height ? { width, height } : undefined}
        >
            <h3 className="text-gray-500 dark:text-gray-400 font-medium absolute top-6 left-6">Studio Performance Average</h3>

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
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                    <PolarGrid stroke={isDark ? "#444" : "#e5e7eb"} />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: isDark ? '#888' : '#6b7280', fontSize: 12 }} />
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
