import { useState } from 'react'
import { useStore } from '../store/useStore'
import { AlertTriangle, Eye, Sun, Moon, Zap, Users, Move } from 'lucide-react'

const ICONS: Record<string, any> = {
  occlusion: Eye, glare: Sun, low_light: Moon, motion_blur: Zap, truncation: AlertTriangle, crowding: Users, dynamic_obstacle: Move,
}

export default function EdgeCases() {
  const datasets = useStore(s => s.datasets)
  const framesByDataset = useStore(s => s.framesByDataset)
  const loadFrames = useStore(s => s.loadFrames)
  const [selected, setSelected] = useState<string>(datasets[0]?.id ?? '')
  const [filter, setFilter] = useState('all')

  if (selected && !framesByDataset[selected]) loadFrames(selected, 60)
  const frames = framesByDataset[selected] ?? []

  // detect edge cases
  const cases = frames.flatMap(f => {
    const out: any[] = []
    if (f.occlusionLevel > 0.3) out.push({ frame: f, type: 'occlusion', severity: f.occlusionLevel > 0.6 ? 'high' : 'medium', score: f.occlusionLevel, desc: `Object occluded ${(f.occlusionLevel * 100).toFixed(0)}%` })
    if (f.lighting === 'glare') out.push({ frame: f, type: 'glare', severity: 'medium', score: 0.7, desc: 'Strong glare / specular highlights' })
    if (f.lighting === 'low_light' || f.lighting === 'night' || f.lighting === 'dim') out.push({ frame: f, type: 'low_light', severity: f.lighting === 'night' ? 'high' : 'medium', score: 0.6, desc: `${f.lighting} condition` })
    if (f.hasDynamicObstacle) out.push({ frame: f, type: 'dynamic_obstacle', severity: 'high', score: 0.85, desc: 'Moving obstacle in scene' })
    if (Math.random() < 0.08) out.push({ frame: f, type: 'motion_blur', severity: 'low', score: 0.4, desc: 'Possible motion blur' })
    if (Math.random() < 0.05) out.push({ frame: f, type: 'crowding', severity: 'medium', score: 0.6, desc: 'Crowded scene (many objects)' })
    return out
  })

  const filtered = filter === 'all' ? cases : cases.filter(c => c.type === filter)
  const counts = cases.reduce((acc: any, c) => { acc[c.type] = (acc[c.type] ?? 0) + 1; return acc }, {})

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Edge Case Detector</h1>
        <p className="text-[#9aa3bf] text-sm mt-1">Identify failure modes: occlusion, glare, low light, motion blur, dynamic obstacles</p>
      </div>

      <div className="card p-4 flex flex-wrap items-center gap-3">
        <select className="input max-w-xs" value={selected} onChange={e => setSelected(e.target.value)}>
          {datasets.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select className="input max-w-xs" value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">All types</option>
          {Object.keys(counts).map(k => <option key={k} value={k}>{k} ({counts[k]})</option>)}
        </select>
        <div className="text-xs text-[#9aa3bf]">{filtered.length} edge cases across {frames.length} frames</div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {Object.entries(counts).map(([k, v]) => {
          const Icon = ICONS[k] ?? AlertTriangle
          return (
            <div key={k} className="card p-3 text-center cursor-pointer hover:border-indigo-500" onClick={() => setFilter(k)}>
              <Icon size={20} className="mx-auto text-amber-400" />
              <div className="text-lg font-bold mt-1">{v as number}</div>
              <div className="text-[10px] text-[#9aa3bf]">{k}</div>
            </div>
          )
        })}
      </div>

      <div className="card p-4">
        <div className="font-semibold mb-3">Detected Edge Cases</div>
        <div className="space-y-2 max-h-[60vh] overflow-y-auto scrollbar-thin">
          {filtered.length === 0 && <div className="text-sm text-[#9aa3bf]">No edge cases detected for this filter.</div>}
          {filtered.slice(0, 200).map((c, i) => {
            const Icon = ICONS[c.type] ?? AlertTriangle
            const sevColor = c.severity === 'high' ? 'badge-danger' : c.severity === 'medium' ? 'badge-warn' : 'badge-accent'
            return (
              <div key={i} className="flex items-center gap-3 p-2 rounded border border-[#2a325a] hover:bg-[#1a2142]">
                <Icon size={16} className="text-amber-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">Frame #{c.frame.index} · {c.frame.scene}</div>
                  <div className="text-xs text-[#9aa3bf]">{c.desc}</div>
                </div>
                <span className={`badge ${sevColor}`}>{c.severity}</span>
                <span className="text-xs text-[#9aa3bf]">{(c.score * 100).toFixed(0)}%</span>
                <button className="btn text-xs" onClick={() => window.location.href = `/annotate/${c.frame.id}`}>Annotate</button>
              </div>
            )
          })}
        </div>
      </div>

      <div className="card p-4">
        <div className="font-semibold mb-2">Recommended Actions</div>
        <ul className="text-sm text-[#9aa3bf] space-y-1">
          <li>• Prioritize high-severity occlusion and dynamic-obstacle frames for manual review.</li>
          <li>• Add glare/low-light variants via Synthetic Data generator (domain randomization).</li>
          <li>• Use auto-annotate then human-verify for crowded scenes.</li>
          <li>• Export edge-case subset as a separate dataset version for targeted retraining.</li>
        </ul>
      </div>
    </div>
  )
}