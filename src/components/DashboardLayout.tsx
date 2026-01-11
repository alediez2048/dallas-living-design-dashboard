import { ReactNode, useState } from 'react';
import { useData } from '../context/DataContext';
import { LayoutDashboard, LogOut, BookOpen } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { LegendView } from './LegendView';

type ViewType = 'overview' | 'legend';

interface DashboardLayoutProps {
    children: ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
    const { isLoading, projects, resetData, isDemoMode } = useData();
    const [activeView, setActiveView] = useState<ViewType>('overview');

    // If no data is loaded, show minimal header with theme toggle and upload screen
    if (projects.length === 0 && !isLoading) {
        return (
            <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#121212] dark:to-[#1a1a1a] text-gray-900 dark:text-white overflow-y-auto transition-colors duration-300">
                {/* Fixed Theme Toggle in top-right */}
                <div className="fixed top-6 right-6 z-50">
                    <ThemeToggle />
                </div>
                {children}
            </main>
        );
    }

    const getPageTitle = () => {
        switch (activeView) {
            case 'legend':
                return 'Legend & Definitions';
            default:
                return 'Overview';
        }
    };

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-[#121212] text-gray-900 dark:text-white font-sans overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 bg-white dark:bg-[#1e1e1e] border-r border-gray-200 dark:border-white/5 flex flex-col transition-colors duration-300">
                <div className="p-6">
                    <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-teal-400 dark:from-blue-400 dark:to-teal-400 bg-clip-text text-transparent">
                        Living Design
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 tracking-widest uppercase">Dallas Studio</p>
                    {isDemoMode && (
                        <div className="mt-2 px-2 py-1 bg-purple-100 dark:bg-purple-500/20 border border-purple-200 dark:border-purple-500/30 rounded-md">
                            <p className="text-[10px] text-purple-700 dark:text-purple-300 font-medium flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></span>
                                Demo Mode
                            </p>
                        </div>
                    )}
                </div>

                <nav className="flex-1 px-4 space-y-2 mt-4">
                    <SidebarItem
                        icon={<LayoutDashboard size={20} />}
                        label="Overview"
                        active={activeView === 'overview'}
                        onClick={() => setActiveView('overview')}
                    />
                    <SidebarItem
                        icon={<BookOpen size={20} />}
                        label="Legend"
                        active={activeView === 'legend'}
                        onClick={() => setActiveView('legend')}
                    />
                </nav>

                <div className="p-4 border-t border-gray-200 dark:border-white/5">
                    <button
                        onClick={resetData}
                        className="flex items-center gap-3 px-4 py-3 w-full text-left text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all text-sm font-medium"
                    >
                        <LogOut size={18} />
                        {isDemoMode ? 'Exit Demo' : 'Reset Data'}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto relative">
                <header className="sticky top-0 z-10 bg-white/80 dark:bg-[#121212]/80 backdrop-blur-md border-b border-gray-200 dark:border-white/5 px-8 py-5 flex justify-between items-center transition-colors duration-300">
                    <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{getPageTitle()}</h1>
                    <div className="flex items-center gap-4">
                        <div className="hidden md:block bg-gray-100 dark:bg-[#1e1e1e] px-4 py-1.5 rounded-full border border-gray-200 dark:border-white/10 text-sm text-gray-500 dark:text-gray-400">
                            {projects.length} Projects {isDemoMode && '(Demo)'}
                        </div>
                        <ThemeToggle />
                    </div>
                </header>

                <div className="p-8">
                    {activeView === 'overview' && children}
                    {activeView === 'legend' && <LegendView />}
                </div>
            </main>
        </div>
    );
};

interface SidebarItemProps {
    icon: ReactNode;
    label: string;
    active?: boolean;
    onClick?: () => void;
}

const SidebarItem = ({ icon, label, active = false, onClick }: SidebarItemProps) => (
    <button
        onClick={onClick}
        className={`
            w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
            ${active
                ? 'bg-blue-50 text-blue-600 dark:bg-blue-600/10 dark:text-blue-400'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/5'
            }
        `}
    >
        {icon}
        {label}
    </button>
);
