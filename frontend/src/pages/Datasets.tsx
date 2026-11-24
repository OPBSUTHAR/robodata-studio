import { useState } from 'react'
import { useStore } from '../store/useStore'
import { Link } from 'react-router-dom'
import { Plus, Database, Filter } from 'lucide-react'
import { uid } from '../lib/utils'

export default function Datasets() {
  const datasets = useStore(s => s.datasets)
  const addDataset = useStore(s => s.addDataset)
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState('')
  const [form, setForm] = useState({ name: '', description: '', source: 'real' as any, modality: 'rgb,depth', frames: 1000 })

  const filtered = datasets.filter(d => d.name.toLowerCase().includes(filter.toLowerCase()))

  const create = () => {
    if (!form.name.trim()) return
    const mods = form.modality.split(',').map(s => s.trim()).filter(Boolean) as any
    const d = {
      id: uid('ds'),
      name: form.name,
      description: form.description || 'New dataset',
      version: '1.0.0',
      modality: mods,
      classes: [
        { id: 1, name: 'object', color: '#6366f1' },
        { id: 2, name: 'obstacle', color: '#ef4444' },
      ],
      frameCount: form.frames,
      annotatedCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tags: [form.source],
      source: form.source,
      license: 'Internal',
    }
    addDataset(d)
    setShowForm(false)
    setForm({ name: '', description: '', source: 'real', modality: 'rgb,depth', frames: 1000 })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Datasets</h1>
          <p className="text-[#9aa3bf] text-sm mt-1">Manage multi-modal robotics datasets</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(s => !s)}><Plus size={16} /> New Dataset</button>
      </div>

      {showForm && (
        <div className="card p-4 space-y-3">
          <div className="grid md:grid-cols-2 gap-3">
            <input className="input" placeholder="Dataset name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <input className="input" placeholder="Modalities (comma)" value={form.modality} onChange={e => setForm({ ...form, modality: e.target.value })} />
            <input className="input" placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            <select className="input" value={form.source} onChange={e => setForm({ ...form, source: e.target.value })}>
              <option value="real">Real</option><option value="synthetic">Synthetic</option><option value="mixed">Mixed</option>
            </select>
            <input className="input" type="number" placeholder="Frame count" value={form.frames} onChange={e => setForm({ ...form, frames: +e.target.value })} />
          </div>
          <div className="flex gap-2">
            <button className="btn btn-primary" onClick={create}>Create</button>
            <button className="btn" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <Filter size={16} className="text-[#9aa3bf]" />
        <input className="input max-w-xs" placeholder="Filter datasets..." value={filter} onChange={e => setFilter(e.target.value)} />
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(d => (
          <div key={d.id} className="card p-4 hover:border-indigo-500 transition">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Database size={18} className="text-indigo-400" />
                <div className="font-semibold">{d.name}</div>
              </div>
              <span className="badge badge-accent">{d.source}</span>
            </div>
            <p className="text-xs text-[#9aa3bf] mt-2 line-clamp-2">{d.description}</p>
            <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
              <div><div className="text-[#9aa3bf]">Frames</div><div className="font-semibold">{d.frameCount.toLocaleString()}</div></div>
              <div><div className="text-[#9aa3bf]">Annotated</div><div className="font-semibold">{d.annotatedCount.toLocaleString()}</div></div>
              <div><div className="text-[#9aa3bf]">Version</div><div className="font-semibold">{d.version}</div></div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1">
              {d.modality.map(m => <span key={m} className="badge badge-accent">{m}</span>)}
            </div>
            <div className="mt-4 flex gap-2">
              <Link to={`/datasets/${d.id}`} className="btn btn-primary text-xs flex-1 justify-center">Open</Link>
              <Link to={`/annotate`} className="btn text-xs">Annotate</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}