import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { ArrowLeft, Grid, List } from 'lucide-react'

export default function DatasetDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const dataset = useStore(s => s.datasets.find(d => d.id === id))
  const frames = useStore(s => s.framesByDataset[id ?? ''] ?? [])
  const loadFrames = useStore(s => s.loadFrames)
  const annotationsByFrame = useStore(s => s.annotationsByFrame)
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [filter, setFilter] = useState('all')

  useEffect(() => { if (id) { loadFrames(id, 48) } }, [id, loadFrames])

  if (!dataset) return <div className="text-[#9aa3bf]">Dataset not found.</div>

  const filtered = frames.filter(f => {
    if (filter === 'unlabeled') return !(annotationsByFrame[f.id]?.length)
    if (filter === 'labeled') return !!(annotationsByFrame[f.id]?.length)
    if (filter === 'occluded') return f.occlusionLevel > 0.3
    if (filter === 'lowlight') return f.lighting === 'low_light' || f.lighting === 'night' || f.lighting === 'dim'
    return true
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button className="btn btn-ghost" onClick={() => navigate('/datasets')}><ArrowLeft size={16} /> Back</button>
        <div>
          <h1 className="text-xl font-bold">{dataset.name}</h1>
          <p className="text-xs text-[#9aa3bf]">{dataset.description} · {dataset.frameCount.toLocaleString()} frames · v{dataset.version}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select className="input max-w-xs" value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">All frames</option>
          <option value="unlabeled">Unlabeled</option>
          <option value="labeled">Labeled</option>
          <option value="occluded">Occluded</option>
          <option value="lowlight">Low light</option>
        </select>
        <button className="btn" onClick={() => setView(v => v === 'grid' ? 'list' : 'grid')}>
          {view === 'grid' ? <List size={16} /> : <Grid size={16} />} {view}
        </button>
        <div className="ml-auto text-xs text-[#9aa3bf]">{filtered.length} of {frames.length} frames loaded</div>
      </div>

      {view === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {filtered.map(f => {
            const anns = annotationsByFrame[f.id] ?? []
            return (
              <button key={f.id} onClick={() => navigate(`/annotate/${f.id}`)}
                className="card overflow-hidden hover:border-indigo-500 transition text-left">
                <FrameThumb frame={f} />
                <div className="p-2">
                  <div className="text-[11px] font-medium truncate">#{f.index} {f.scene}</div>
                  <div className="flex items-center justify-between mt-1">
                    <span className={`badge ${anns.length ? 'badge-success' : 'badge-warn'}`}>{anns.length} labels</span>
                    {f.occlusionLevel > 0.3 && <span className="badge badge-danger">occ</span>}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-[#9aa3bf] text-xs">
              <tr><th className="text-left py-2 px-3">Index</th><th className="text-left py-2 px-3">Scene</th><th className="text-left py-2 px-3">Lighting</th><th className="text-left py-2 px-3">Occlusion</th><th className="text-left py-2 px-3">Labels</th><th></th></tr>
            </thead>
            <tbody>
              {filtered.map(f => (
                <tr key={f.id} className="border-t border-[#2a325a] hover:bg-[#1a2142]">
                  <td className="py-2 px-3">#{f.index}</td>
                  <td className="py-2 px-3">{f.scene}</td>
                  <td className="py-2 px-3">{f.lighting}</td>
                  <td className="py-2 px-3">{(f.occlusionLevel * 100).toFixed(0)}%</td>
                  <td className="py-2 px-3">{annotationsByFrame[f.id]?.length ?? 0}</td>
                  <td className="py-2 px-3 text-right"><button className="btn text-xs" onClick={() => navigate(`/annotate/${f.id}`)}>Annotate</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function FrameThumb({ frame }: { frame: any }) {
  // synthetic thumbnail via canvas
  return (
    <div className="relative w-full aspect-video bg-[#0b1020] overflow-hidden">
      <canvas ref={el => {
        if (!el) return
        const ctx = el.getContext('2d')
        if (!ctx) return
        el.width = 320; el.height = 180
        // gradient background by lighting
        const g = ctx.createLinearGradient(0, 0, 320, 180)
        const pal: Record<string, string[]> = {
          bright: ['#1e3a5f', '#3b82f6'],
          dim: ['#0f172a', '#1e293b'],
          glare: ['#7c3aed', '#fbbf24'],
          low_light: ['#020617', '#1e293b'],
          night: ['#000000', '#0f172a'],
        }
        const [c1, c2] = pal[frame.lighting] ?? pal.bright
        g.addColorStop(0, c1); g.addColorStop(1, c2)
        ctx.fillStyle = g; ctx.fillRect(0, 0, 320, 180)
        // random shapes as "objects"
        const rng = (s: number) => { let x = s; return () => { x = (x * 9301 + 49297) % 233280; return x / 233280 } }
        const r = rng(frame.index * 997 + 1)
        for (let i = 0; i < 5; i++) {
          ctx.fillStyle = `hsl(${r() * 360}, 60%, 55%)`
          ctx.fillRect(r() * 260, r() * 120, 20 + r() * 60, 20 + r() * 50)
        }
        // modality badge
        ctx.fillStyle = 'rgba(0,0,0,0.5)'
        ctx.fillRect(6, 6, 70, 18)
        ctx.fillStyle = '#fff'; ctx.font = '10px sans-serif'; ctx.fillText(frame.modalities?.join('/') ?? 'rgb', 10, 19)
        if (frame.occlusionLevel > 0.3) {
          ctx.fillStyle = 'rgba(239,68,68,0.35)'; ctx.fillRect(0, 0, 320, 180)
        }
      }} style={{ width: '100%', height: '100%', display: 'block' }} />
    </div>
  )
}