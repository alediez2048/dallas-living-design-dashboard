import { ProjectMetrics } from '../types';

interface GoalTrackerProps {
    projects: ProjectMetrics[];
    type: 'eui' | 'water';
}

export const GoalTracker = ({ projects, type }: GoalTrackerProps) => {

    // Calculate stats
    const eligibleProjects = projects.filter(p => p.isEligible); // Or all projects? Assuming all for now based on stats
    const total = eligibleProjects.length;

    let meetingGoalCount = 0;
    let label = "";
    let color = "";
    let percentage = 0;

    if (type === 'eui') {
        meetingGoalCount = eligibleProjects.filter(p => p.resilience.meets2030Goal).length;
        label = "Meeting 2030 EUI Goal";
        color = "text-yellow-400";
        percentage = total > 0 ? Math.round((meetingGoalCount / total) * 100) : 0;
    } else {
        meetingGoalCount = eligibleProjects.filter(p => p.resilience.meetsWaterGoal).length;
        label = "Meeting Water Goal";
        color = "text-blue-400";
        percentage = total > 0 ? Math.round((meetingGoalCount / total) * 100) : 0;
    }

    return (
        <div className="p-6 rounded-2xl bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-white/5 flex flex-col justify-between h-40 relative overflow-hidden group shadow-sm dark:shadow-none transition-colors duration-300">

            {/* Background Progress Bar (Subtle) */}
            <div
                className={`absolute bottom-0 left-0 h-1 transition-all duration-1000 ${type === 'eui' ? 'bg-yellow-500' : 'bg-blue-500'}`}
                style={{ width: `${percentage}%` }}
            />

            <div>
                <h3 className="text-gray-500 dark:text-gray-400 font-medium mb-1">{label}</h3>
                <div className="flex items-baseline gap-2">
                    <span className={`text-4xl font-bold ${color}`}>{percentage}%</span>
                    <span className="text-sm text-gray-500">of projects</span>
                </div>
            </div>

            <div className="flex justify-between items-end mt-4">
                <div className="text-xs text-gray-500">
                    <span className="text-gray-900 dark:text-white font-semibold">{meetingGoalCount}</span> / {total} Total
                </div>

                {/* Mini Circle visual */}
                <svg viewBox="0 0 36 36" className="w-12 h-12 transform -rotate-90">
                    <path
                        className="text-gray-100 dark:text-gray-700"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                    />
                    <path
                        className={`${type === 'eui' ? 'text-yellow-500' : 'text-blue-500'} transition-all duration-1000 ease-out`}
                        strokeDasharray={`${percentage}, 100`}
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                    />
                </svg>
            </div>
        </div>
    );
};
