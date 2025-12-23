import { ReactNode } from 'react';
import { useData } from '../context/DataContext';
import { LayoutDashboard, Leaf, Activity, Settings, LogOut } from 'lucide-react';

export const DashboardLayout = ({ children }: { children: ReactNode }) => {
    const { isLoading, projects, resetData } = useData();

    // If no data is loaded, just show the upload screen (which is passed as children initially)
    // But once data IS loaded, we want to show the full dashboard shell.
    // We'll handle this conditionally in App.tsx mainly, but here we define the Shell structure.

    if (projects.length === 0 && !isLoading) {
        return <main className="min-h-screen bg-[#1a1a1a] text-white overflow-y-auto">{children}</main>;
    }

    return (
        <div className="flex h-screen bg-[#121212] text-white font-sans overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 bg-[#1e1e1e] border-r border-white/5 flex flex-col">
                <div className="p-6">
                    <h2 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">
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
                        className="flex items-center gap-3 px-4 py-3 w-full text-left text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all text-sm font-medium"
                    >
                        <LogOut size={18} />
                        Reset Data
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto relative">
                <header className="sticky top-0 z-10 bg-[#121212]/80 backdrop-blur-md border-b border-white/5 px-8 py-5 flex justify-between items-center">
                    <h1 className="text-2xl font-semibold">Overview</h1>
                    <div className="flex items-center gap-4">
                        <div className="bg-[#1e1e1e] px-4 py-1.5 rounded-full border border-white/10 text-sm text-gray-400">
                            {projects.length} Projects Loaded
                        </div>
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
            ? 'bg-blue-600/10 text-blue-400'
            : 'text-gray-400 hover:text-white hover:bg-white/5'
        }
    `}>
        {icon}
        {label}
    </button>
);
