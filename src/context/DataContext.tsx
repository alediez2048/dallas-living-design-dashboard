import { createContext, useContext, useState, ReactNode, useMemo } from 'react';
import { ProjectMetrics } from '../types';
import { parseProjectData } from '../utils/parser';
import { generateSampleData } from '../utils/sampleDataGenerator';

interface DataContextType {
    projects: ProjectMetrics[];
    logs: string[];
    isLoading: boolean;
    error: string | null;
    isDemoMode: boolean;
    activeYears: number[];
    availableYears: number[];
    setActiveYears: (years: number[]) => void;
    loadData: (files: { file: File; year: number }[]) => Promise<void>;
    loadDemoData: () => void;
    resetData: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }) => {
    const [projects, setProjects] = useState<ProjectMetrics[]>([]);
    const [logs, setLogs] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDemoMode, setIsDemoMode] = useState(false);
    const [activeYears, setActiveYears] = useState<number[]>([]);

    const availableYears = useMemo(() => {
        const years = new Set(projects.map(p => p.reportingYear));
        return Array.from(years).sort((a, b) => b - a); // Sort descending
    }, [projects]);

    const loadData = async (files: { file: File; year: number }[]) => {
        setIsLoading(true);
        setError(null);
        setLogs([]);
        setIsDemoMode(false);
        try {
            const allProjects: ProjectMetrics[] = [];
            const allLogs: string[] = [];

            for (const { file, year } of files) {
                const { projects: data, logs: parserLogs } = await parseProjectData(file, year);
                allProjects.push(...data);
                allLogs.push(`--- Log for ${file.name} (Year: ${year}) ---`);
                allLogs.push(...parserLogs);
            }

            setLogs(allLogs);

            if (allProjects.length === 0) {
                throw new Error("No valid projects found in the provided files.");
            }
            setProjects(allProjects);

            // Auto-select all available years by default
            const years = Array.from(new Set(allProjects.map(p => p.reportingYear))).sort((a, b) => b - a);
            setActiveYears(years);
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : "Failed to parse files");
        } finally {
            setIsLoading(false);
        }
    };

    const loadDemoData = () => {
        setIsLoading(true);
        setError(null);
        setLogs(['Demo mode: Loading sample data...']);

        // Simulate loading delay for better UX
        setTimeout(() => {
            const sampleProjects = generateSampleData();
            setProjects(sampleProjects);

            const years = Array.from(new Set(sampleProjects.map(p => p.reportingYear))).sort((a, b) => b - a);
            setActiveYears(years);

            setIsDemoMode(true);
            setLogs([
                'Demo mode: Loading sample data...',
                `Generated ${sampleProjects.length} sample projects`,
                'Sectors: K12, Higher ED, CCC, Healthcare DIV, Workplace',
                'Note: This is sample data for demonstration purposes'
            ]);
            setIsLoading(false);
        }, 800);
    };

    const resetData = () => {
        setProjects([]);
        setLogs([]);
        setError(null);
        setIsDemoMode(false);
        setActiveYears([]);
    };

    return (
        <DataContext.Provider value={{ projects, logs, isLoading, error, isDemoMode, activeYears, availableYears, setActiveYears, loadData, loadDemoData, resetData }}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};
