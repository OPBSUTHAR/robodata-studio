import { useEffect, useState } from 'react'
import { ExternalLink, Search, Database, Image as ImageIcon, Loader2 } from 'lucide-react'
import { get } from '../lib/api'

interface Source { name: string; url: string; type: string; license: string; size: string }
interface CocoSample { id: string; url: string; source: string; license: string }
interface HFResult { id: string; author?: string; downloads: number; likes: number; tags: string[]; url: string }

export default function PublicDataHub() {
  const [sources, setSources] = useState<Source[]>([])
  const [samples, setSamples] = useState<CocoSample[]>([])
  const [q, setQ] = useState('robotics')
  const [hf, setHf] = useState<HFResult[]>([])
  const [hfLoading, setHfLoading] = useState(false)

  useEffect(() => {
    get<Source[]>('/api/public/sources').then(setSources).catch(() => {})
    get<CocoSample[]>('/api/public/coco-samples').then(setSamples).catch(() => {})
  }, [])

  const searchHF = async () => {
    setHfLoading(true)
    try {
      const res = await get<{ results: HFResult[] }>(`/api/public/hf-search?q=${encodeURIComponent(q)}&limit=24`)
      setHf(res.results ?? [])
    } catch { setHf([]) }
    setHfLoading(false)
  }

  useEffect(() => { searchHF() }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Public Data Hub</h1>
        <p className="text-[#9aa3bf] text-sm mt-1">Real public robotics datasets & samples — COCO, Hugging Face, and more</p>
      </div>

      <div className="card p-4">
        <div className="font-semibold mb-3 flex items-center gap-2"><Database size={16} className="text-indigo-400" /> Known Public Robotics Data Sources</div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {sources.map(s => (
            <a key={s.name} href={s.url} target="_blank" rel="noreferrer"
              className="card p-3 hover:border-indigo-500 transition block">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-sm">{s.name}</div>
                <ExternalLink size={12} className="text-[#9aa3bf]" />
              </div>
              <div className="text-xs text-[#9aa3bf] mt-1">{s.type}</div>
              <div className="flex justify-between text-[10px] text-[#9aa3bf] mt-2">
                <span>{s.size}</span><span>{s.license}</span>
              </div>
            </a>
          ))}
        </div>
      </div>

      <div className="card p-4">
        <div className="font-semibold mb-3 flex items-center gap-2"><ImageIcon size={16} className="text-cyan-400" /> Real COCO 2017 Val Samples</div>
        <p className="text-xs text-[#9aa3bf] mb-3">Annotate these real images in the Annotation Studio.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {samples.map(s => (
            <a key={s.id} href={`/annotate?img=${encodeURIComponent(s.url)}`} className="card overflow-hidden hover:border-indigo-500 transition">
              <img src={s.url} alt={s.id} className="w-full aspect-video object-cover" loading="lazy" />
              <div className="p-1.5 text-[10px] text-[#9aa3bf] truncate">{s.id}</div>
            </a>
          ))}
        </div>
      </div>

      <div className="card p-4">
        <div className="font-semibold mb-3 flex items-center gap-2"><Search size={16} className="text-amber-400" /> Hugging Face Dataset Search (Robotics)</div>
        <div className="flex gap-2 mb-3">
          <input className="input" value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchHF()} placeholder="Search datasets..." />
          <button className="btn btn-primary" onClick={searchHF} disabled={hfLoading}>
            {hfLoading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />} Search
          </button>
        </div>
        {hfLoading && <div className="text-sm text-[#9aa3bf]">Searching Hugging Face...</div>}
        <div className="grid md:grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto scrollbar-thin">
          {hf.map(d => (
            <a key={d.id} href={d.url} target="_blank" rel="noreferrer" className="card p-3 hover:border-indigo-500 transition block">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-sm truncate">{d.id}</div>
                <ExternalLink size={12} className="text-[#9aa3bf] shrink-0" />
              </div>
              <div className="text-[10px] text-[#9aa3bf] mt-1">by {d.author ?? 'unknown'} · ↓{d.downloads.toLocaleString()} · ♥{d.likes}</div>
              <div className="flex flex-wrap gap-1 mt-2">
                {d.tags.slice(0, 5).map(t => <span key={t} className="badge badge-accent text-[9px]">{t}</span>)}
              </div>
            </a>
          ))}
        </div>
        {!hfLoading && hf.length === 0 && <div className="text-sm text-[#9aa3bf]">No results. Try another query.</div>}
      </div>
    </div>
  )
}