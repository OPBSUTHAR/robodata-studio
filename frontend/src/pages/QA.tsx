import { useState } from 'react'
import { useStore } from '../store/useStore'
import { Play, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts'

export default function QA() {
  const datasets = useStore(s => s.datasets)
  const framesByDataset = useStore(s => s.framesByDataset)
  const loadFrames = useStore(s => s.loadFrames)
  const runQA = useStore(s => s.runQA)
  const qaCache = useStore(s => s.qaCache)
  const [selected, setSelected] = useState<string>(datasets[0]?.id ?? '')
  const [running, setRunning] = useState(false)
  const metrics = selected ? qaCache[selected] : null

  const handleRun = async () => {
    if (!selected) return
    if (!framesByDataset[selected]) loadFrames(selected, 60)
    setRunning(true)
    await new Promise(r => setTimeout(r, 900))
    runQA(selected)
    setRunning(false)
  }

  const imbalanceData = metrics ? Object.entries(metrics.classImbalance).map(([k, v]) => ({ name: k, value: +(v * 100).toFixed(1) })) : []

  const radarData = metrics ? [
    { metric: 'IoU', value: metrics.iouMean * 100 },
    { metric: 'Precision', value: metrics.precision * 100 },
    { metric: 'Recall', value: metrics.recall * 100 },
    { metric: 'F1', value: metrics.f1 * 100 },
    { metric: 'Consistency', value: metrics.labelConsistency * 100 },
  ] : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Quality Assurance</h1>
        <p className="text-[#9aa3bf] text-sm mt-1">Annotation quality, consistency & dataset health</p>
      </div>

      <div className="card p-4 flex flex-wrap items-center gap-3">
        <select className="input max-w-xs" value={selected} onChange={e => setSelected(e.target.value)}>
          {datasets.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <button className="btn btn-primary" onClick={handleRun} disabled={running || !selected}>
          {running ? 'Running QA...' : <><Play size={16} /> Run QA</>}
        </button>
        <div className="text-xs text-[#9aa3bf]">Checks: IoU, precision/recall, class imbalance, OOB coords, missing labels, duplicates, consistency</div>
      </div>

      {metrics && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Mean IoU" value={metrics.iouMean.toFixed(3)} color="text-indigo-400" />
            <StatCard label="Precision" value={(metrics.precision * 100).toFixed(1) + '%'} color="text-cyan-400" />
            <StatCard label="Recall" value={(metrics.recall * 100).toFixed(1) + '%'} color="text-green-400" />
            <StatCard label="F1 Score" value={(metrics.f1 * 100).toFixed(1) + '%'} color="text-amber-400" />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="card p-4">
              <div className="font-semibold mb-3">Quality Radar</div>
              <ResponsiveContainer width="100%" height={260}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#2a325a" />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: '#9aa3bf', fontSize: 11 }} />
                  <PolarRadiusAxis tick={{ fill: '#9aa3bf', fontSize: 9 }} domain={[0, 100]} />
                  <Radar dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
                  <Tooltip contentStyle={{ background: '#121830', border: '1px solid #2a325a', color: '#e6e8f0' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="card p-4">
              <div className="font-semibold mb-3">Class Imbalance (%)</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={imbalanceData}>
                  <XAxis dataKey="name" tick={{ fill: '#9aa3bf', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#9aa3bf', fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: '#121830', border: '1px solid #2a325a', color: '#e6e8f0' }} />
                  <Bar dataKey="value" fill="#22d3ee" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card p-4">
            <div className="font-semibold mb-3">Issues Detected</div>
            <div className="grid md:grid-cols-3 gap-3">
              <IssueCard icon={AlertTriangle} label="Out-of-bounds boxes" value={metrics.outOfBounds} severity={metrics.outOfBounds > 5 ? 'high' : 'low'} />
              <IssueCard icon={AlertTriangle} label="Missing labels (frames)" value={metrics.missingLabels} severity={metrics.missingLabels > 5 ? 'medium' : 'low'} />
              <IssueCard icon={AlertTriangle} label="Duplicate frames" value={metrics.duplicateFrames} severity={metrics.duplicateFrames > 3 ? 'medium' : 'low'} />
              <IssueCard icon={CheckCircle2} label="Label consistency" value={(metrics.labelConsistency * 100).toFixed(1) + '%'} severity="low" />
            </div>
          </div>

          <div className="card p-4">
            <div className="font-semibold mb-3">Recommendations</div>
            <ul className="text-sm space-y-2 text-[#9aa3bf]">
              {metrics.outOfBounds > 0 && <li>• Fix {metrics.outOfBounds} out-of-bounds bounding boxes (coordinates exceed frame dimensions).</li>}
              {metrics.missingLabels > 0 && <li>• {metrics.missingLabels} frames have no labels — run auto-annotate or label manually.</li>}
              {metrics.duplicateFrames > 0 && <li>• Remove {metrics.duplicateFrames} duplicate frames to reduce bias.</li>}
              {metrics.recall < 0.8 && <li>• Recall is low — consider adding more positive examples / hard negatives.</li>}
              {Object.values(metrics.classImbalance).some(v => v > 0.5) && <li>• Class imbalance detected — apply oversampling or class weights.</li>}
              <li>• Consider domain randomization to improve sim-to-real generalization.</li>
            </ul>
          </div>
        </>
      )}
      {!metrics && <div className="card p-8 text-center text-[#9aa3bf]">Select a dataset and run QA to see metrics.</div>}
    </div>
  )
}

function StatCard({ label, value, color }: any) {
  return (
    <div className="card p-4">
      <div className="text-xs text-[#9aa3bf]">{label}</div>
      <div className={`text-2xl font-bold mt-1 ${color}`}>{value}</div>
    </div>
  )
}
function IssueCard({ icon: Icon, label, value, severity }: any) {
  const color = severity === 'high' ? 'text-red-400' : severity === 'medium' ? 'text-amber-400' : 'text-green-400'
  return (
    <div className="card p-3 flex items-center gap-3">
      <Icon size={18} className={color} />
      <div>
        <div className="text-xs text-[#9aa3bf]">{label}</div>
        <div className="font-semibold">{value}</div>
      </div>
    </div>
  )
}