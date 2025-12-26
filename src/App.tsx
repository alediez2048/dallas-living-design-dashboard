import { DataProvider, useData } from './context/DataContext'
import { FileUploader } from './components/FileUploader'
import { DashboardLayout } from './components/DashboardLayout'
import { PetalRadar } from './components/PetalRadar'
import { GoalTracker } from './components/GoalTracker'

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';

// Inner component to access context
const DashboardContent = () => {
  const { projects, logs } = useData();
  const [activeSector, setActiveSector] = useState<string>("All Sectors");
  const [hoveredProject, setHoveredProject] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);

  // Define the explicit tabs request
  const TABS = [
    { id: "All Sectors", label: "Studio Overview" },
    { id: "K12", label: "K12" },
    { id: "Higher ED", label: "Higher ED" },
    { id: "CCC", label: "CCC" },
    { id: "Healthcare DIV", label: "Healthcare DIV" },
    { id: "Diversified Healthcare Interiors", label: "Diversified Healthcare Interiors" },
    { id: "Healthcare HCA", label: "Healthcare HCA" },
    { id: "Workplace", label: "Workplace" }
  ];

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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <DashboardLayout>
      {/* Sector Tabs */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSector(tab.id)}
            className={`
              px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300
              ${activeSector === tab.id
                ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)] scale-105 dark:shadow-[0_0_20px_rgba(255,255,255,0.1)]'
                : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50 dark:bg-[#1e1e1e] dark:text-gray-400 dark:hover:text-white dark:hover:bg-[#252525] border dark:border-white/5'
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <motion.div
        key={activeSector}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Top Row: Counters & Goals */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
          <motion.div variants={itemVariants} className="p-6 rounded-2xl bg-white/80 dark:bg-[#1e1e1e]/80 backdrop-blur-sm border border-gray-200 dark:border-white/5 flex flex-col justify-center hover:border-gray-300 dark:hover:border-white/20 transition-colors shadow-sm dark:shadow-none">
            <h3 className="text-gray-500 dark:text-gray-400 mb-2 font-medium">Total Projects</h3>
            <div className="flex items-baseline gap-2">
              <p className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 dark:from-blue-400 dark:to-blue-200 bg-clip-text text-transparent">
                {filteredProjects.length}
              </p>
              <span className="text-xs text-gray-500 uppercase tracking-wider">All</span>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="p-6 rounded-2xl bg-white/80 dark:bg-[#1e1e1e]/80 backdrop-blur-sm border border-gray-200 dark:border-white/5 flex flex-col justify-center hover:border-gray-300 dark:hover:border-white/20 transition-colors shadow-sm dark:shadow-none">
            <h3 className="text-gray-500 dark:text-gray-400 mb-2 font-medium">Total Eligible</h3>
            <div className="flex items-baseline gap-2">
              <p className="text-5xl font-bold bg-gradient-to-r from-gray-700 to-gray-400 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
                {filteredProjects.filter(p => p.isEligible).length}
              </p>
              <span className="text-xs text-gray-500 uppercase tracking-wider">Projects</span>
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <GoalTracker projects={filteredProjects} type="eui" />
          </motion.div>
          <motion.div variants={itemVariants}>
            <GoalTracker projects={filteredProjects} type="water" />
          </motion.div>

          <motion.div variants={itemVariants} className="p-6 rounded-2xl bg-white/80 dark:bg-[#1e1e1e]/80 backdrop-blur-sm border border-gray-200 dark:border-white/5 flex flex-col justify-center hover:border-gray-300 dark:hover:border-white/20 transition-colors shadow-sm dark:shadow-none">
            <h3 className="text-gray-500 dark:text-gray-400 mb-2 font-medium">Switch List Vetted</h3>
            <p className="text-5xl font-bold text-teal-400">
              {filteredProjects.filter(p => p.health.switchListVetted).length}
            </p>
            <p className="text-xs text-teal-400/50 mt-2 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
              Verified Healthy
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Radar Chart */}
          <motion.div variants={itemVariants} className="lg:col-span-1">
            <PetalRadar projects={filteredProjects} />
          </motion.div>

          {/* Detailed List */}
          <motion.div variants={itemVariants} className="lg:col-span-2 p-6 rounded-2xl bg-white/80 dark:bg-[#1e1e1e]/80 backdrop-blur-sm border border-gray-200 dark:border-white/5 flex flex-col shadow-sm dark:shadow-none overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-teal-500 dark:from-blue-200 dark:to-teal-200 bg-clip-text text-transparent">Project Details</h3>
              <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-white/5 px-3 py-1.5 rounded-full border border-gray-200 dark:border-white/5">
                {filteredProjects.length} Active Projects
              </span>
            </div>

            <div className="overflow-x-auto overflow-y-auto flex-1 max-h-[400px] scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-white/10 hover:scrollbar-thumb-gray-300 dark:hover:scrollbar-thumb-white/20 -mx-6 px-6">
              <table className="min-w-full text-left text-sm text-gray-500 dark:text-gray-400 border-collapse">
                <thead className="text-xs uppercase bg-gray-50/90 dark:bg-[#1a1a1a]/90 text-gray-700 dark:text-gray-200 sticky top-0 backdrop-blur-md z-10 shadow-sm">
                  <tr>
                    <th className="px-5 py-4 rounded-tl-lg">Project Name</th>
                    <th className="px-5 py-4">Sector</th>
                    <th className="px-5 py-4">Phase</th>
                    <th className="px-5 py-4 text-center">Eligible?</th>
                    <th className="px-5 py-4 text-right">EUI Red.</th>
                    <th className="px-5 py-4 text-right rounded-tr-lg">Water Red.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                  {filteredProjects.map((p, i) => (
                    <motion.tr
                      key={p.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      onMouseEnter={() => setHoveredProject(p.id)}
                      onMouseLeave={() => setHoveredProject(null)}
                      className={`
                                        transition-all duration-200 cursor-default
                                        ${hoveredProject === p.id ? 'bg-blue-50/50 dark:bg-white/10 scale-[1.01] shadow-lg' : 'hover:bg-gray-50 dark:hover:bg-white/5'}
                                    `}
                    >
                      <td className="px-5 py-3 font-medium text-gray-900 dark:text-white transition-colors truncate max-w-[200px] border-l-4 border-transparent hover:border-blue-400">
                        {p.name}
                      </td>
                      <td className="px-5 py-3 opacity-80">{p.sector}</td>
                      <td className="px-5 py-3 opacity-80">
                        <span className="px-2 py-1 rounded-md bg-gray-100 dark:bg-white/5 text-xs">{p.phase}</span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        {(() => {
                          const status = p.eligibilityStatus || (p.isEligible ? "Yes" : "No");

                          let colorClass = "bg-gray-100 dark:bg-gray-700/50 text-gray-500";
                          let text = "N";

                          if (status === "Yes") {
                            colorClass = "bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400";
                            text = "Y";
                          } else if (status === "TBD") {
                            colorClass = "bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 w-auto px-2";
                            text = "TBD";
                          } else if (status === "No 2026") {
                            colorClass = "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 w-auto px-2";
                            text = "2026";
                          }

                          return (
                            <span className={`inline-flex items-center justify-center min-w-[1.5rem] h-6 rounded-full text-[10px] font-bold ${colorClass}`}>
                              {text}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-gray-900 dark:text-white">{(p.resilience.euiReduction * 100).toFixed(0)}%</td>
                      <td className="px-5 py-3 text-right font-mono text-gray-900 dark:text-white">{(p.resilience.indoorWaterReduction * 100).toFixed(0)}%</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </motion.div>
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setShowDebug(!showDebug)}
          className="bg-gray-800 text-white px-3 py-1 rounded-full text-xs opacity-50 hover:opacity-100"
        >
          {showDebug ? 'Hide Debug' : 'Debug Parser'}
        </button>
      </div>

      {showDebug && (
        <div className="fixed bottom-0 left-0 right-0 h-64 bg-black/90 text-green-400 font-mono text-xs p-4 overflow-auto z-40 border-t border-gray-700 backdrop-blur-md">
          <h3 className="font-bold mb-2 text-white sticky top-0 bg-black/90 p-1">Parser Logs</h3>
          {logs.length === 0 ? (
            <div className="text-gray-500">No logs available. Upload a file to see parsing details.</div>
          ) : (
            logs.map((log, i) => (
              <div key={i} className="whitespace-pre-wrap border-b border-gray-800 py-0.5">{log}</div>
            ))
          )}
        </div>
      )}

    </DashboardLayout>
  )
}

import { ThemeProvider } from './context/ThemeContext'

function App() {
  return (
    <DataProvider>
      <ThemeProvider>
        <DashboardContent />
      </ThemeProvider>
    </DataProvider>
  )
}

export default App
