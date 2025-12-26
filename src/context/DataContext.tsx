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
    loadData: (file: File) => Promise<void>;
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

    const loadData = async (file: File) => {
        setIsLoading(true);
        setError(null);
        setLogs([]);
        setIsDemoMode(false);
        try {
            const { projects: data, logs: parserLogs } = await parseProjectData(file);
            setLogs(parserLogs);

            if (data.length === 0) {
                throw new Error("No valid projects found in file.");
            }
            setProjects(data);
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : "Failed to parse file");
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
    };

    return (
        <DataContext.Provider value={{ projects, logs, isLoading, error, isDemoMode, loadData, loadDemoData, resetData }}>
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
