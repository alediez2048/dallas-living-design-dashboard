import { DataProvider, useData } from './context/DataContext'
import { FileUploader } from './components/FileUploader'
import { DashboardLayout } from './components/DashboardLayout'

// Inner component to access context
const DashboardContent = () => {
  const { projects } = useData();

  if (projects.length === 0) {
    return (
      <DashboardLayout>
        <FileUploader />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Placeholder cards for now */}
        <div className="p-6 rounded-2xl bg-[#1e1e1e] border border-white/5">
          <h3 className="text-gray-400 mb-2">Total Projects</h3>
          <p className="text-4xl font-bold">{projects.length}</p>
        </div>
        <div className="p-6 rounded-2xl bg-[#1e1e1e] border border-white/5">
          <h3 className="text-gray-400 mb-2">Resilience Score</h3>
          <p className="text-4xl font-bold text-green-400">--</p>
        </div>
        <div className="p-6 rounded-2xl bg-[#1e1e1e] border border-white/5">
          <h3 className="text-gray-400 mb-2">Health Score</h3>
          <p className="text-4xl font-bold text-blue-400">--</p>
        </div>
      </div>

      <div className="mt-8 p-6 rounded-2xl bg-[#1e1e1e] border border-white/5">
        <h3 className="text-lg font-semibold mb-4">Raw Data Preview</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-400">
            <thead className="text-xs uppercase bg-white/5 text-gray-200">
              <tr>
                <th className="px-4 py-3">Project Name</th>
                <th className="px-4 py-3">Sector</th>
                <th className="px-4 py-3">Phase</th>
                <th className="px-4 py-3">Eligible?</th>
                <th className="px-4 py-3">EUI Red.</th>
                <th className="px-4 py-3">Water Red.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {projects.slice(0, 10).map((p) => (
                <tr key={p.id} className="hover:bg-white/5">
                  <td className="px-4 py-3 font-medium text-white">{p.name}</td>
                  <td className="px-4 py-3">{p.sector}</td>
                  <td className="px-4 py-3">{p.phase}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs ${p.isEligible ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-300'}`}>
                      {p.isEligible ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="px-4 py-3">{(p.resilience.euiReduction * 100).toFixed(1)}%</td>
                  <td className="px-4 py-3">{(p.resilience.indoorWaterReduction * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
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
