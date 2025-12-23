import { createContext, useContext, useState, ReactNode, useMemo } from 'react';
import { ProjectMetrics } from '../types';
import { parseProjectData } from '../utils/parser';

interface DataContextType {
    projects: ProjectMetrics[];
    logs: string[];
    isLoading: boolean;
    error: string | null;
    loadData: (file: File) => Promise<void>;
    resetData: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }) => {
    const [projects, setProjects] = useState<ProjectMetrics[]>([]);
    const [logs, setLogs] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadData = async (file: File) => {
        setIsLoading(true);
        setError(null);
        setLogs([]);
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

    const resetData = () => {
        setProjects([]);
        setLogs([]);
        setError(null);
    };

    return (
        <DataContext.Provider value={{ projects, logs, isLoading, error, loadData, resetData }}>
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
