import { useState } from 'react'
import { useStore } from '../store/useStore'
import { Download, GitBranch, Plus, FileJson, FileText, Box } from 'lucide-react'
import { downloadJSON, downloadText } from '../lib/utils'

export default function ExportCenter() {
  const datasets = useStore(s => s.datasets)
  const framesByDataset = useStore(s => s.framesByDataset)
  const annotationsByFrame = useStore(s => s.annotationsByFrame)
  const versionsByDataset = useStore(s => s.versionsByDataset)
  const createVersion = useStore(s => s.createVersion)
  const loadFrames = useStore(s => s.loadFrames)
  const [selected, setSelected] = useState<string>(datasets[0]?.id ?? '')
  const [format, setFormat] = useState('coco')
  const [versionNote, setVersionNote] = useState('')

  if (selected && !framesByDataset[selected]) loadFrames(selected, 60)
  const frames = framesByDataset[selected] ?? []
  const versions = versionsByDataset[selected] ?? []

  const exportCOCO = () => {
    const ds = datasets.find(d => d.id === selected)
    const images = frames.map(f => ({ id: f.id, file_name: `${f.id}.png`, width: f.width, height: f.height }))
    const categories = (ds?.classes ?? []).map(c => ({ id: c.id, name: c.name }))
    const anns: any[] = []
    let aid = 1
    frames.forEach(f => {
      (annotationsByFrame[f.id] ?? []).forEach(a => {
        if (a.bbox) {
          anns.push({ id: aid++, image_id: f.id, category_id: a.classId, bbox: [a.bbox.x, a.bbox.y, a.bbox.w, a.bbox.h], area: a.bbox.w * a.bbox.h, iscrowd: 0, segmentation: a.polygon ? [a.polygon.flatMap(p => [p.x, p.y])] : [] })
        }
        if (a.polygon) {
          anns.push({ id: aid++, image_id: f.id, category_id: a.classId, bbox: [0, 0, 0, 0], segmentation: [a.polygon.flatMap(p => [p.x, p.y])], area: 1, iscrowd: 0 })
        }
      })
    })
    const coco = { info: { description: ds?.name, version: ds?.version }, images, annotations: anns, categories }
    downloadJSON(`${ds?.name}_coco.json`, coco)
  }

  const exportYOLO = () => {
    const ds = datasets.find(d => d.id === selected)
    const lines: string[] = []
    frames.forEach(f => {
      (annotationsByFrame[f.id] ?? []).forEach(a => {
        if (a.bbox) {
          const xc = (a.bbox.x + a.bbox.w / 2) / f.width
          const yc = (a.bbox.y + a.bbox.h / 2) / f.height
          const w = a.bbox.w / f.width
          const h = a.bbox.h / f.height
          lines.push(`${a.classId - 1} ${xc.toFixed(6)} ${yc.toFixed(6)} ${w.toFixed(6)} ${h.toFixed(6)}`)
        }
      })
      lines.push('---') // frame separator
    })
    downloadText(`${ds?.name}_yolo.txt`, lines.join('\n'), 'text/plain')
  }

  const exportPCD = () => {
    const ds = datasets.find(d => d.id === selected)
    const f = frames[0]
    const pts = f?.pointCloud ?? []
    const header = `# .PCD v0.7\nVERSION 0.7\nFIELDS x y z rgb\nSIZE 4 4 4 4\nTYPE F F F F\nCOUNT 1 1 1 1\nWIDTH ${pts.length}\nHEIGHT 1\nVIEWPOINT 0 0 0 1 0 0 0\nPOINTS ${pts.length}\nDATA ascii\n`
    const body = pts.map(p => `${p.x.toFixed(4)} ${p.y.toFixed(4)} ${p.z.toFixed(4)} ${( (p.r ?? 128) << 16 | (p.g ?? 128) << 8 | (p.b ?? 128))}`).join('\n')
    downloadText(`${ds?.name}_sample.pcd`, header + body, 'text/plain')
  }

  const exportJSONL = () => {
    const ds = datasets.find(d => d.id === selected)
    const lines = frames.map(f => JSON.stringify({
      frame_id: f.id, scene: f.scene, lighting: f.lighting, occlusion: f.occlusionLevel,
      modalities: f.modalities, annotations: annotationsByFrame[f.id] ?? [],
    }))
    downloadText(`${ds?.name}_metadata.jsonl`, lines.join('\n'), 'application/jsonl')
  }

  const newVersion = () => {
    if (!selected || !versionNote.trim()) return
    createVersion(selected, versionNote)
    setVersionNote('')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Export Center</h1>
        <p className="text-[#9aa3bf] text-sm mt-1">Export datasets to COCO, YOLO, PCD, JSONL · manage versions</p>
      </div>

      <div className="card p-4 flex flex-wrap items-center gap-3">
        <select className="input max-w-xs" value={selected} onChange={e => setSelected(e.target.value)}>
          {datasets.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <div className="flex gap-2">
          {[
            { id: 'coco', label: 'COCO JSON', icon: FileJson },
            { id: 'yolo', label: 'YOLO txt', icon: FileText },
            { id: 'pcd', label: 'PCD', icon: Box },
            { id: 'jsonl', label: 'JSONL', icon: FileJson },
          ].map(f => (
            <button key={f.id} className={`btn text-xs ${format === f.id ? 'btn-primary' : ''}`} onClick={() => setFormat(f.id)}>
              <f.icon size={12} /> {f.label}
            </button>
          ))}
        </div>
        <button className="btn btn-primary ml-auto" onClick={() => {
          if (format === 'coco') exportCOCO()
          else if (format === 'yolo') exportYOLO()
          else if (format === 'pcd') exportPCD()
          else exportJSONL()
        }}><Download size={16} /> Export {format.toUpperCase()}</button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card p-4">
          <div className="font-semibold mb-3 flex items-center gap-2"><GitBranch size={16} className="text-indigo-400" /> Version History</div>
          <div className="space-y-2 max-h-72 overflow-y-auto scrollbar-thin">
            {versions.length === 0 && <div className="text-xs text-[#9aa3bf]">No versions yet.</div>}
            {versions.map(v => (
              <div key={v.id} className="p-3 rounded border border-[#2a325a] bg-[#1a2142]">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm">v{v.version}</span>
                  <span className="text-[10px] text-[#9aa3bf]">{new Date(v.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="text-xs text-[#9aa3bf] mt-1">{v.changes}</div>
                <div className="text-[10px] text-[#9aa3bf] mt-1">{v.frameCount} frames · hash {v.hash.slice(0, 8)}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <input className="input text-xs" placeholder="Version change notes..." value={versionNote} onChange={e => setVersionNote(e.target.value)} />
            <button className="btn btn-primary text-xs" onClick={newVersion} disabled={!versionNote.trim()}><Plus size={12} /> Tag Version</button>
          </div>
        </div>

        <div className="card p-4">
          <div className="font-semibold mb-3">Export Summary</div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-[#9aa3bf]">Frames</span><span>{frames.length}</span></div>
            <div className="flex justify-between"><span className="text-[#9aa3bf]">Annotations</span><span>{frames.reduce((a, f) => a + (annotationsByFrame[f.id]?.length ?? 0), 0)}</span></div>
            <div className="flex justify-between"><span className="text-[#9aa3bf]">Classes</span><span>{datasets.find(d => d.id === selected)?.classes.length ?? 0}</span></div>
            <div className="flex justify-between"><span className="text-[#9aa3bf]">Versions</span><span>{versions.length}</span></div>
            <div className="flex justify-between"><span className="text-[#9aa3bf]">Modalities</span><span>{datasets.find(d => d.id === selected)?.modality.join(', ')}</span></div>
          </div>
          <div className="mt-4 text-xs text-[#9aa3bf]">
            Formats supported: COCO JSON (bbox + segmentation), YOLO (normalized coords), PCD (point clouds), JSONL (metadata).
          </div>
        </div>
      </div>
    </div>
  )
}