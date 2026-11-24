import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { ArrowLeft, Square, Pen, CircleDot, Box, Trash2, Wand2, Download, Undo2, MousePointer2, Layers } from 'lucide-react'
import { uid } from '../lib/utils'
import type { Annotation } from '../lib/types'

type Tool = 'select' | 'bbox' | 'polygon' | 'keypoint' | 'cuboid'

export default function AnnotationStudio() {
  const { frameId } = useParams()
  const navigate = useNavigate()
  const datasets = useStore(s => s.datasets)
  const framesByDataset = useStore(s => s.framesByDataset)
  const annotationsByFrame = useStore(s => s.annotationsByFrame)
  const addAnnotation = useStore(s => s.addAnnotation)
  const deleteAnnotation = useStore(s => s.deleteAnnotation)
  // updateAnnotation available if needed
  const autoAnnotate = useStore(s => s.autoAnnotate)
  const loadFrames = useStore(s => s.loadFrames)

  // find frame
  const allFrames = Object.values(framesByDataset).flat()
  let frame = allFrames.find(f => f.id === frameId)
  if (!frame && frameId) {
    // try load from any dataset
    const ds = datasets[0]
    if (ds && !framesByDataset[ds.id]) loadFrames(ds.id, 60)
  }
  // fallback: first frame
  if (!frame) frame = allFrames[0]

  const [tool, setTool] = useState<Tool>('select')
  const [selectedClass, setSelectedClass] = useState(1)
  const [selectedAnn, setSelectedAnn] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [drawing, setDrawing] = useState(false)
  const [start, setStart] = useState<{ x: number; y: number } | null>(null)
  const [polyPoints, setPolyPoints] = useState<{ x: number; y: number }[]>([])
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null)
  const [showPC, setShowPC] = useState(true)

  const dataset = datasets.find(d => d.id === frame?.datasetId)
  const classes = dataset?.classes ?? [{ id: 1, name: 'object', color: '#6366f1' }]
  const anns = frame ? (annotationsByFrame[frame.id] ?? []) : []

  // draw
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !frame) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    canvas.width = frame.width
    canvas.height = frame.height
    // background
    const pal: Record<string, string[]> = {
      bright: ['#1e3a5f', '#3b82f6'],
      dim: ['#0f172a', '#1e293b'],
      glare: ['#7c3aed', '#fbbf24'],
      low_light: ['#020617', '#1e293b'],
      night: ['#000000', '#0f172a'],
    }
    const [c1, c2] = pal[frame.lighting] ?? pal.bright
    const g = ctx.createLinearGradient(0, 0, frame.width, frame.height)
    g.addColorStop(0, c1); g.addColorStop(1, c2)
    ctx.fillStyle = g; ctx.fillRect(0, 0, frame.width, frame.height)
    const rng = (s: number) => { let x = s; return () => { x = (x * 9301 + 49297) % 233280; return x / 233280 } }
    const r = rng(frame.index * 997 + 1)
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = `hsl(${r() * 360}, 60%, 55%)`
      ctx.fillRect(r() * (frame.width - 80), r() * (frame.height - 80), 30 + r() * 90, 30 + r() * 70)
    }
    if (frame.occlusionLevel > 0.3) {
      ctx.fillStyle = 'rgba(239,68,68,0.25)'; ctx.fillRect(0, 0, frame.width, frame.height)
    }
    // draw annotations
    anns.forEach(a => {
      const cls = classes.find(c => c.id === a.classId)
      const color = cls?.color ?? '#6366f1'
      const sel = a.id === selectedAnn
      ctx.lineWidth = sel ? 3 : 2
      ctx.strokeStyle = color
      ctx.fillStyle = color + '33'
      if (a.bbox) {
        ctx.fillRect(a.bbox.x, a.bbox.y, a.bbox.w, a.bbox.h)
        ctx.strokeRect(a.bbox.x, a.bbox.y, a.bbox.w, a.bbox.h)
        ctx.fillStyle = color
        ctx.font = '12px sans-serif'
        ctx.fillText(`${a.className} ${a.confidence ? (a.confidence * 100).toFixed(0) + '%' : ''}`, a.bbox.x + 4, a.bbox.y - 4)
      }
      if (a.polygon && a.polygon.length) {
        ctx.beginPath()
        ctx.moveTo(a.polygon[0].x, a.polygon[0].y)
        a.polygon.forEach(p => ctx.lineTo(p.x, p.y))
        ctx.closePath()
        ctx.fill(); ctx.stroke()
      }
      if (a.keypoints) {
        a.keypoints.forEach(kp => {
          if (kp.v === 0) return
          ctx.fillStyle = kp.v === 1 ? '#f59e0b' : color
          ctx.beginPath(); ctx.arc(kp.x, kp.y, 4, 0, Math.PI * 2); ctx.fill()
        })
      }
      if (a.cuboid) {
        // draw projected center
        const c = a.cuboid.center
        const px = frame.width / 2 + c[0] * 200
        const py = frame.height / 2 - c[1] * 200
        ctx.strokeStyle = color; ctx.lineWidth = 2
        ctx.strokeRect(px - 30, py - 30, 60, 60)
        ctx.fillStyle = color; ctx.font = '11px sans-serif'; ctx.fillText(a.className + ' (3D)', px - 28, py - 34)
      }
    })
    // in-progress polygon
    if (polyPoints.length) {
      ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 2; ctx.setLineDash([4, 4])
      ctx.beginPath(); ctx.moveTo(polyPoints[0].x, polyPoints[0].y)
      polyPoints.forEach(p => ctx.lineTo(p.x, p.y))
      if (cursor) ctx.lineTo(cursor.x, cursor.y)
      ctx.stroke(); ctx.setLineDash([])
      polyPoints.forEach(p => { ctx.fillStyle = '#fbbf24'; ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); ctx.fill() })
    }
    // in-progress bbox
    if (drawing && start && cursor && tool === 'bbox') {
      const w = cursor.x - start.x, h = cursor.y - start.y
      ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 2; ctx.setLineDash([4, 4])
      ctx.strokeRect(start.x, start.y, w, h); ctx.setLineDash([])
    }
  }, [frame, anns, selectedAnn, drawing, start, cursor, polyPoints, tool, classes])

  const getPos = (e: React.MouseEvent) => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const scaleX = frame!.width / rect.width
    const scaleY = frame!.height / rect.height
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY }
  }

  const onMouseDown = (e: React.MouseEvent) => {
    if (!frame) return
    const p = getPos(e)
    if (tool === 'bbox') { setDrawing(true); setStart(p) }
    if (tool === 'polygon') {
      setPolyPoints(prev => [...prev, p])
    }
    if (tool === 'keypoint') {
      // add keypoint to selected or new annotation
      const cls = classes.find(c => c.id === selectedClass)
      const ann: Annotation = {
        id: uid('ann'), frameId: frame.id, type: 'keypoint', classId: selectedClass,
        className: cls?.name ?? 'object', keypoints: [{ x: p.x, y: p.y, v: 2 }],
        annotator: 'human', createdAt: Date.now(), status: 'labeled',
      }
      addAnnotation(ann)
    }
    if (tool === 'cuboid') {
      const cls = classes.find(c => c.id === selectedClass)
      const cx = (p.x / frame.width - 0.5) * 2
      const cy = -(p.y / frame.height - 0.5) * 2
      const ann: Annotation = {
        id: uid('ann'), frameId: frame.id, type: 'cuboid3d', classId: selectedClass,
        className: cls?.name ?? 'object',
        cuboid: { center: [cx, cy * 0.5, 1.0], size: [0.2, 0.2, 0.2], rotation: [0, 0, 0] },
        annotator: 'human', createdAt: Date.now(), status: 'labeled',
      }
      addAnnotation(ann)
    }
  }

  const onMouseMove = (e: React.MouseEvent) => {
    if (!frame) return
    const p = getPos(e)
    setCursor(p)
    if (drawing && tool === 'bbox') { /* redraw via effect */ }
  }

  const onMouseUp = (e: React.MouseEvent) => {
    if (!frame || tool !== 'bbox' || !drawing || !start) return
    const p = getPos(e)
    const x = Math.min(start.x, p.x), y = Math.min(start.y, p.y)
    const w = Math.abs(p.x - start.x), h = Math.abs(p.y - start.y)
    if (w > 5 && h > 5) {
      const cls = classes.find(c => c.id === selectedClass)
      const ann: Annotation = {
        id: uid('ann'), frameId: frame.id, type: 'bbox2d', classId: selectedClass,
        className: cls?.name ?? 'object', bbox: { x, y, w, h },
        annotator: 'human', createdAt: Date.now(), status: 'labeled', confidence: 1,
      }
      addAnnotation(ann)
    }
    setDrawing(false); setStart(null)
  }

  const finishPolygon = () => {
    if (polyPoints.length < 3 || !frame) return
    const cls = classes.find(c => c.id === selectedClass)
    const ann: Annotation = {
      id: uid('ann'), frameId: frame.id, type: 'polygon', classId: selectedClass,
      className: cls?.name ?? 'object', polygon: [...polyPoints],
      annotator: 'human', createdAt: Date.now(), status: 'labeled',
    }
    addAnnotation(ann)
    setPolyPoints([])
  }

  const onAuto = () => {
    if (!frame) return
    const n = autoAnnotate(frame.id)
    alert(`Auto-annotated ${n} objects (simulated YOLO+SAM).`)
  }

  const onExportFrame = () => {
    if (!frame) return
    const data = { frame, annotations: anns }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `${frame.id}.json`; a.click()
    URL.revokeObjectURL(url)
  }

  if (!frame) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Annotation Studio</h1>
        <div className="card p-6 text-center text-[#9aa3bf]">
          No frame selected. Go to a dataset and click a frame.
          <div className="mt-3"><button className="btn btn-primary" onClick={() => navigate('/datasets')}>Browse Datasets</button></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <button className="btn btn-ghost" onClick={() => navigate(-1)}><ArrowLeft size={16} /></button>
        <div>
          <h1 className="text-xl font-bold">Annotation Studio</h1>
          <p className="text-xs text-[#9aa3bf]">Frame #{frame.index} · {frame.scene} · {frame.lighting} · {frame.width}×{frame.height}</p>
        </div>
        <div className="ml-auto flex gap-2">
          <button className="btn" onClick={onAuto}><Wand2 size={16} /> Auto-annotate</button>
          <button className="btn" onClick={onExportFrame}><Download size={16} /> Export</button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_300px] gap-4">
        <div className="card p-2">
          {/* toolbar */}
          <div className="flex flex-wrap items-center gap-2 mb-2 p-1">
            {([
              { id: 'select', icon: MousePointer2, label: 'Select' },
              { id: 'bbox', icon: Square, label: 'BBox' },
              { id: 'polygon', icon: Pen, label: 'Polygon' },
              { id: 'keypoint', icon: CircleDot, label: 'Keypoint' },
              { id: 'cuboid', icon: Box, label: '3D Cuboid' },
            ] as const).map(t => (
              <button key={t.id} className={`btn text-xs ${tool === t.id ? 'btn-primary' : ''}`} onClick={() => { setTool(t.id); setPolyPoints([]) }}>
                <t.icon size={14} /> {t.label}
              </button>
            ))}
            <select className="input max-w-[140px] text-xs" value={selectedClass} onChange={e => setSelectedClass(+e.target.value)}>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {tool === 'polygon' && polyPoints.length > 0 && (
              <button className="btn btn-primary text-xs" onClick={finishPolygon}><Undo2 size={14} /> Finish Polygon ({polyPoints.length})</button>
            )}
            {tool === 'polygon' && polyPoints.length > 0 && (
              <button className="btn text-xs" onClick={() => setPolyPoints([])}>Clear</button>
            )}
          </div>
          <div className="relative">
            <canvas ref={canvasRef}
              className="w-full h-auto border border-[#2a325a] rounded cursor-crosshair"
              onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp}
              style={{ maxHeight: '60vh' }} />
          </div>
          <div className="text-xs text-[#9aa3bf] mt-2 px-1">
            {tool === 'bbox' && 'Drag to draw a bounding box.'}
            {tool === 'polygon' && 'Click points, then Finish Polygon.'}
            {tool === 'keypoint' && 'Click to add keypoint.'}
            {tool === 'cuboid' && 'Click to place 3D cuboid center.'}
            {tool === 'select' && 'View mode.'}
          </div>
        </div>

        <div className="space-y-3">
          <div className="card p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold text-sm">Annotations ({anns.length})</div>
              <button className="btn text-xs" onClick={() => setShowPC(s => !s)}><Layers size={12} /> 3D {showPC ? 'on' : 'off'}</button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-thin">
              {anns.length === 0 && <div className="text-xs text-[#9aa3bf]">No annotations yet.</div>}
              {anns.map(a => {
                const cls = classes.find(c => c.id === a.classId)
                return (
                  <div key={a.id} className={`p-2 rounded border ${selectedAnn === a.id ? 'border-indigo-500 bg-indigo-500/10' : 'border-[#2a325a] bg-[#1a2142]'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded" style={{ background: cls?.color }} />
                        <span className="text-xs font-medium">{a.className}</span>
                        <span className="badge badge-accent text-[10px]">{a.type}</span>
                      </div>
                      <button className="btn btn-ghost p-1" onClick={() => { deleteAnnotation(a.id, a.frameId); setSelectedAnn(null) }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                    {a.bbox && <div className="text-[10px] text-[#9aa3bf] mt-1">bbox: {a.bbox.x.toFixed(0)},{a.bbox.y.toFixed(0)} {a.bbox.w.toFixed(0)}×{a.bbox.h.toFixed(0)}</div>}
                    {a.confidence && <div className="text-[10px] text-[#9aa3bf]">conf: {(a.confidence * 100).toFixed(1)}% · {a.annotator}</div>}
                  </div>
                )
              })}
            </div>
          </div>

          {showPC && frame.pointCloud && (
            <div className="card p-2">
              <div className="font-semibold text-sm mb-2">Point Cloud (3D)</div>
              <PointCloudViewer points={frame.pointCloud} />
            </div>
          )}

          <div className="card p-3">
            <div className="font-semibold text-sm mb-2">Frame Info</div>
            <div className="text-xs space-y-1 text-[#9aa3bf]">
              <div>Scene: {frame.scene}</div>
              <div>Lighting: {frame.lighting}</div>
              <div>Occlusion: {(frame.occlusionLevel * 100).toFixed(0)}%</div>
              <div>Dynamic obstacle: {frame.hasDynamicObstacle ? 'yes' : 'no'}</div>
              <div>Points: {frame.pointCloud?.length ?? 0}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function PointCloudViewer({ points }: { points: any[] }) {
  // simple canvas-based 3D projection
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current; if (!c) return
    c.width = 280; c.height = 200
    const ctx = c.getContext('2d')!
    ctx.fillStyle = '#0b1020'; ctx.fillRect(0, 0, 280, 200)
    // rotate
    const angle = Date.now() / 2000
    const cos = Math.cos(angle), sin = Math.sin(angle)
    const projected = points.map(p => {
      const x = p.x * cos - p.z * sin
      const z = p.x * sin + p.z * cos
      const scale = 80 / (z + 2)
      return { sx: 140 + x * scale, sy: 100 - p.y * scale, z, color: p.label ? `hsl(${p.label * 40}, 70%, 60%)` : '#fff' }
    }).sort((a, b) => b.z - a.z)
    projected.forEach(p => {
      ctx.fillStyle = p.color
      ctx.beginPath(); ctx.arc(p.sx, p.sy, 1.5, 0, Math.PI * 2); ctx.fill()
    })
  })
  return <canvas ref={ref} className="w-full rounded" />
}