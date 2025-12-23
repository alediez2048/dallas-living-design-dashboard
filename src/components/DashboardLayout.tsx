import { ReactNode } from 'react';
import { useData } from '../context/DataContext';
import { LayoutDashboard, Leaf, Activity, Settings, LogOut } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

export const DashboardLayout = ({ children }: { children: ReactNode }) => {
    const { isLoading, projects, resetData } = useData();

    // If no data is loaded, just show the upload screen (which is passed as children initially)
    // But once data IS loaded, we want to show the full dashboard shell.
    // We'll handle this conditionally in App.tsx mainly, but here we define the Shell structure.

    if (projects.length === 0 && !isLoading) {
        return <main className="min-h-screen bg-gray-50 dark:bg-[#1a1a1a] text-gray-900 dark:text-white overflow-y-auto">{children}</main>;
    }

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-[#121212] text-gray-900 dark:text-white font-sans overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 bg-white dark:bg-[#1e1e1e] border-r border-gray-200 dark:border-white/5 flex flex-col transition-colors duration-300">
                <div className="p-6">
                    <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-teal-400 dark:from-blue-400 dark:to-teal-400 bg-clip-text text-transparent">
                        Living Design
                    </h2>
                    <p className="text-xs text-gray-500 mt-1 tracking-widest uppercase">Dallas Studio</p>
                </div>

                <nav className="flex-1 px-4 space-y-2 mt-4">
                    <SidebarItem icon={<LayoutDashboard size={20} />} label="Overview" active />
                    <SidebarItem icon={<Leaf size={20} />} label="Resilience" />
                    <SidebarItem icon={<Activity size={20} />} label="Health & Wellbeing" />
                </nav>

                <div className="p-4 border-t border-white/5">
                    <button
                        onClick={resetData}
                        className="flex items-center gap-3 px-4 py-3 w-full text-left text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all text-sm font-medium"
                    >
                        <LogOut size={18} />
                        Reset Data
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto relative">
                <header className="sticky top-0 z-10 bg-white/80 dark:bg-[#121212]/80 backdrop-blur-md border-b border-gray-200 dark:border-white/5 px-8 py-5 flex justify-between items-center transition-colors duration-300">
                    <h1 className="text-2xl font-semibold">Overview</h1>
                    <div className="flex items-center gap-4">
                        <div className="hidden md:block bg-gray-100 dark:bg-[#1e1e1e] px-4 py-1.5 rounded-full border border-gray-200 dark:border-white/10 text-sm text-gray-500 dark:text-gray-400">
                            {projects.length} Projects Loaded
                        </div>
                        <ThemeToggle />
                    </div>
                </header>

                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    );
};

const SidebarItem = ({ icon, label, active = false }: { icon: ReactNode, label: string, active?: boolean }) => (
    <button className={`
        w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
        ${active
            ? 'bg-blue-50 text-blue-600 dark:bg-blue-600/10 dark:text-blue-400'
            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/5'
        }
    `}>
        {icon}
        {label}
    </button>
);
