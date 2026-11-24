import { useStore } from '../store/useStore'
import { Link } from 'react-router-dom'
import { Database, PenTool, ShieldCheck, Activity, Layers, TrendingUp, Sparkles } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

export default function Dashboard() {
  const datasets = useStore(s => s.datasets)
  const annotationsByFrame = useStore(s => s.annotationsByFrame)

  const totalFrames = datasets.reduce((a, d) => a + d.frameCount, 0)
  const totalAnnotated = Object.values(annotationsByFrame).reduce((a, b) => a + b.length, 0)
  const totalDatasets = datasets.length

  const chartData = datasets.map(d => ({ name: d.name.slice(0, 12), frames: d.frameCount, annotated: d.annotatedCount }))
  const pieData = [
    { name: 'Labeled', value: totalAnnotated },
    { name: 'Unlabeled', value: Math.max(0, totalFrames - totalAnnotated) },
  ]
  const COLORS = ['#6366f1', '#2a325a']

  const stats = [
    { label: 'Datasets', value: totalDatasets, icon: Database, color: 'text-indigo-400' },
    { label: 'Total Frames', value: totalFrames.toLocaleString(), icon: Layers, color: 'text-cyan-400' },
    { label: 'Annotations', value: totalAnnotated.toLocaleString(), icon: PenTool, color: 'text-green-400' },
    { label: 'Modalities', value: 'RGB·Depth·LiDAR', icon: Activity, color: 'text-amber-400' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-[#9aa3bf] text-sm mt-1">Robotics perception data farming overview</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="card p-4">
            <div className="flex items-center justify-between">
              <div className="text-[#9aa3bf] text-xs">{s.label}</div>
              <s.icon size={16} className={s.color} />
            </div>
            <div className="text-2xl font-bold mt-2">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card p-4">
          <div className="font-semibold mb-3 flex items-center gap-2"><TrendingUp size={16} className="text-indigo-400" /> Frames per Dataset</div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData}>
              <XAxis dataKey="name" tick={{ fill: '#9aa3bf', fontSize: 10 }} />
              <YAxis tick={{ fill: '#9aa3bf', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: '#121830', border: '1px solid #2a325a', color: '#e6e8f0' }} />
              <Bar dataKey="frames" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="annotated" fill="#22d3ee" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card p-4">
          <div className="font-semibold mb-3">Label Coverage</div>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={90} label>
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#121830', border: '1px solid #2a325a', color: '#e6e8f0' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card p-4">
        <div className="font-semibold mb-3">Datasets</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-[#9aa3bf] text-xs">
              <tr>
                <th className="text-left py-2">Name</th>
                <th className="text-left py-2">Source</th>
                <th className="text-left py-2">Modalities</th>
                <th className="text-right py-2">Frames</th>
                <th className="text-right py-2">Annotated</th>
                <th className="text-left py-2">Version</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {datasets.map(d => (
                <tr key={d.id} className="border-t border-[#2a325a] hover:bg-[#1a2142]">
                  <td className="py-2 font-medium">{d.name}</td>
                  <td className="py-2"><span className="badge badge-accent">{d.source}</span></td>
                  <td className="py-2 text-xs text-[#9aa3bf]">{d.modality.join(', ')}</td>
                  <td className="py-2 text-right">{d.frameCount.toLocaleString()}</td>
                  <td className="py-2 text-right">{d.annotatedCount.toLocaleString()}</td>
                  <td className="py-2 text-xs">{d.version}</td>
                  <td className="py-2 text-right">
                    <Link to={`/datasets/${d.id}`} className="btn btn-ghost text-xs">Open</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Link to="/annotate" className="card p-4 hover:border-indigo-500 transition flex items-center gap-3">
          <PenTool className="text-indigo-400" /> <div><div className="font-semibold">Annotation Studio</div><div className="text-xs text-[#9aa3bf]">2D/3D/temporal labeling</div></div>
        </Link>
        <Link to="/synthetic" className="card p-4 hover:border-cyan-400 transition flex items-center gap-3">
          <Sparkles className="text-cyan-400" /> <div><div className="font-semibold">Synthetic Data</div><div className="text-xs text-[#9aa3bf]">Domain randomization</div></div>
        </Link>
        <Link to="/qa" className="card p-4 hover:border-green-400 transition flex items-center gap-3">
          <ShieldCheck className="text-green-400" /> <div><div className="font-semibold">Quality Assurance</div><div className="text-xs text-[#9aa3bf]">IoU, precision/recall</div></div>
        </Link>
      </div>
    </div>
  )
}