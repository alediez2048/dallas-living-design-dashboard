import { useMemo } from 'react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, Tooltip, Legend } from 'recharts';
import { ProjectMetrics } from '../types';

interface PetalRadarProps {
    projects: ProjectMetrics[];
}

export const PetalRadar = ({ projects }: PetalRadarProps) => {

    const data = useMemo(() => {
        if (projects.length === 0) return [];

        let totalProjects = projects.length;

        // Initialize accumulators
        let acc = {
            // Resilience
            euiReduction: 0,
            indoorWater: 0,
            ecology: 0,
            resilience: 0,
            opCarbon: 0,

            // Health
            air: 0,
            light: 0,
            thermal: 0,
            acoustic: 0,
            waterQual: 0,
            biophilia: 0,
            switchList: 0
        };

        projects.forEach(p => {
            // Normalize to 0-100 scale where applicable
            acc.euiReduction += Math.max(0, p.resilience.euiReduction * 100);
            acc.indoorWater += Math.max(0, p.resilience.indoorWaterReduction * 100);
            acc.ecology += p.resilience.ecologyScore ? 100 : 0; // Simplified scoring
            acc.resilience += p.resilience.resilienceScore ? 100 : 0;
            acc.opCarbon += p.resilience.operationalCarbonReduction ? 100 : 0;

            acc.air += p.health.airScore ? 100 : 0;
            acc.light += p.health.lightScore ? 100 : 0;
            acc.thermal += p.health.thermalComfortScore ? 100 : 0;
            acc.acoustic += p.health.acousticScore ? 100 : 0;
            acc.waterQual += p.health.waterQualityScore ? 100 : 0;
            acc.biophilia += p.health.biophiliaScore ? 100 : 0;
            acc.switchList += p.health.switchListVetted ? 100 : 0;
        });

        // Create array for Recharts
        return [
            { subject: 'EUI Red.', A: acc.euiReduction / totalProjects, fullMark: 100 },
            { subject: 'Water Red.', A: acc.indoorWater / totalProjects, fullMark: 100 },
            { subject: 'Ecology', A: acc.ecology / totalProjects, fullMark: 100 },
            { subject: 'Resilience', A: acc.resilience / totalProjects, fullMark: 100 },
            { subject: 'Air', A: acc.air / totalProjects, fullMark: 100 },
            { subject: 'Light', A: acc.light / totalProjects, fullMark: 100 },
            { subject: 'Thermal', A: acc.thermal / totalProjects, fullMark: 100 },
            { subject: 'Acoustic', A: acc.acoustic / totalProjects, fullMark: 100 },
            { subject: 'Biophilia', A: acc.biophilia / totalProjects, fullMark: 100 },
        ];
    }, [projects]);

    return (
        <div className="h-[400px] w-full bg-[#1e1e1e] rounded-2xl border border-white/5 p-4 flex flex-col items-center justify-center relative">
            <h3 className="text-gray-400 font-medium absolute top-6 left-6">Studio Performance (Average)</h3>

            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                    <PolarGrid stroke="#444" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#888', fontSize: 12 }} />
                    <Radar
                        name="Studio Average"
                        dataKey="A"
                        stroke="#60a5fa"
                        strokeWidth={3}
                        fill="#3b82f6"
                        fillOpacity={0.3}
                    />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#222', border: '1px solid #444', color: '#fff' }}
                        itemStyle={{ color: '#60a5fa' }}
                    />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
};
