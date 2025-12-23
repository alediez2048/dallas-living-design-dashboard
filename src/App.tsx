import { DataProvider, useData } from './context/DataContext'
import { FileUploader } from './components/FileUploader'
import { DashboardLayout } from './components/DashboardLayout'
import { PetalRadar } from './components/PetalRadar'
import { GoalTracker } from './components/GoalTracker'

import { useState, useMemo } from 'react';

// Inner component to access context
const DashboardContent = () => {
  const { projects } = useData();
  const [activeSector, setActiveSector] = useState<string>("All Sectors");

  const sectors = useMemo(() => {
    // Get unique sectors, filter out "Unknown Sector" if desired or keep it
    const s = new Set(projects.map(p => p.sector).filter(s => s && s !== "Unknown Sector"));
    return ["All Sectors", ...Array.from(s).sort()];
  }, [projects]);

  const filteredProjects = useMemo(() => {
    if (activeSector === "All Sectors") return projects;
    return projects.filter(p => p.sector === activeSector);
  }, [projects, activeSector]);

  if (projects.length === 0) {
    return (
      <DashboardLayout>
        <FileUploader />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Sector Tabs */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10">
        {sectors.map(sector => (
          <button
            key={sector}
            onClick={() => setActiveSector(sector)}
            className={`
              px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all
              ${activeSector === sector
                ? 'bg-white text-black shadow-lg shadow-white/10'
                : 'bg-[#1e1e1e] text-gray-400 hover:text-white hover:bg-[#252525] border border-white/5'
              }
            `}
          >
            {sector === "All Sectors" ? "Studio Overview" : sector}
          </button>
        ))}
      </div>

      {/* Top Row: Counters & Goals */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="p-6 rounded-2xl bg-[#1e1e1e] border border-white/5 flex flex-col justify-center">
          <h3 className="text-gray-400 mb-2 font-medium">Total Eligible</h3>
          <p className="text-5xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            {filteredProjects.filter(p => p.isEligible).length}
          </p>
          <p className="text-xs text-gray-500 mt-2">Projects Tracking</p>
        </div>

        <GoalTracker projects={filteredProjects} type="eui" />
        <GoalTracker projects={filteredProjects} type="water" />

        <div className="p-6 rounded-2xl bg-[#1e1e1e] border border-white/5 flex flex-col justify-center">
          <h3 className="text-gray-400 mb-2 font-medium">Switch List Vetted</h3>
          <p className="text-5xl font-bold text-teal-400">
            {filteredProjects.filter(p => p.health.switchListVetted).length}
          </p>
          <p className="text-xs text-gray-500 mt-2">Projects Compliant</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Radar Chart - Takes up 1/3 or 1/2 */}
        <div className="lg:col-span-1">
          <PetalRadar projects={filteredProjects} />
        </div>

        {/* Detailed List */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-[#1e1e1e] border border-white/5 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Detailed Project List</h3>
            <span className="text-xs text-xs text-gray-500 bg-white/5 px-2 py-1 rounded">
              Showing {filteredProjects.length} projects
            </span>
          </div>

          <div className="overflow-x-auto flex-1 h-[320px]">
            <table className="w-full text-left text-sm text-gray-400 border-collapse">
              <thead className="text-xs uppercase bg-white/5 text-gray-200 sticky top-0 backdrop-blur-md z-10">
                <tr>
                  <th className="px-4 py-3 rounded-tl-lg bg-[#252525]">Project Name</th>
                  <th className="px-4 py-3 bg-[#252525]">Sector</th>
                  <th className="px-4 py-3 bg-[#252525]">Phase</th>
                  <th className="px-4 py-3 text-center bg-[#252525]">Eligible?</th>
                  <th className="px-4 py-3 text-right bg-[#252525]">EUI Red.</th>
                  <th className="px-4 py-3 text-right rounded-tr-lg bg-[#252525]">Water Red.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredProjects.slice(0, 100).map((p) => (
                  <tr key={p.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-4 py-2 font-medium text-white group-hover:text-blue-400 transition-colors truncate max-w-[200px]">{p.name}</td>
                    <td className="px-4 py-2 opacity-80">{p.sector}</td>
                    <td className="px-4 py-2 opacity-80">{p.phase}</td>
                    <td className="px-4 py-2 text-center">
                      <span className={`w-2 h-2 rounded-full inline-block ${p.isEligible ? 'bg-green-500' : 'bg-gray-700'}`}></span>
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-white">{(p.resilience.euiReduction * 100).toFixed(0)}%</td>
                    <td className="px-4 py-2 text-right font-mono text-white">{(p.resilience.indoorWaterReduction * 100).toFixed(0)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

function App() {
  return (
    <DataProvider>
      <DashboardContent />
    </DataProvider>
  )
}

export default App
