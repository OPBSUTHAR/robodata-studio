import { useState } from 'react'
import { useStore } from '../store/useStore'
import { Sparkles, Play, RefreshCw } from 'lucide-react'
import { uid } from '../lib/utils'
import type { Dataset } from '../lib/types'

export default function Synthetic() {
  const cfg = useStore(s => s.syntheticConfig)
  const setCfg = useStore(s => s.setSyntheticConfig)
  const addDataset = useStore(s => s.addDataset)
  // loadFrames available if needed
  const [generating, setGenerating] = useState(false)
  const [previewSeed, setPreviewSeed] = useState(1)
  const [generated, setGenerated] = useState(0)

  const update = (path: string, value: any) => {
    const parts = path.split('.')
    const next: any = { ...cfg }
    let cur = next
    for (let i = 0; i < parts.length - 1; i++) { cur[parts[i]] = { ...cur[parts[i]] }; cur = cur[parts[i]] }
    cur[parts[parts.length - 1]] = value
    setCfg(next)
  }

  const generate = async () => {
    setGenerating(true)
    await new Promise(r => setTimeout(r, 1200))
    const ds: Dataset = {
      id: uid('ds'),
      name: `Synthetic_DomainRand_${Date.now().toString(36).slice(-4)}`,
      description: `Synthetic dataset generated with domain randomization. Seed ${cfg.seed}.`,
      version: '1.0.0',
      modality: ['rgb', 'depth', 'pointcloud'],
      classes: [
        { id: 1, name: 'robot_arm', color: '#6366f1' },
        { id: 2, name: 'workpiece', color: '#22c55e' },
        { id: 3, name: 'tool', color: '#a855f7' },
      ],
      frameCount: cfg.frames,
      annotatedCount: cfg.frames,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tags: ['synthetic', 'domain_randomization'],
      source: 'synthetic',
      license: 'Internal',
    }
    addDataset(ds)
    setGenerated(g => g + cfg.frames)
    setGenerating(false)
  }

  // preview canvas
  const seed = previewSeed

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Synthetic Data Generator</h1>
        <p className="text-[#9aa3bf] text-sm mt-1">Domain randomization for sim-to-real transfer</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card p-4 space-y-4">
          <div className="font-semibold flex items-center gap-2"><Sparkles size={16} className="text-cyan-400" /> Randomization Controls</div>

          <div>
            <label className="text-xs text-[#9aa3bf]">Lighting Intensity: {cfg.lighting.intensity.toFixed(2)}</label>
            <input type="range" min={0.2} max={2} step={0.05} value={cfg.lighting.intensity} onChange={e => update('lighting.intensity', +e.target.value)} className="w-full" />
          </div>
          <div>
            <label className="text-xs text-[#9aa3bf]">Ambient: {cfg.lighting.ambient.toFixed(2)}</label>
            <input type="range" min={0} max={1} step={0.05} value={cfg.lighting.ambient} onChange={e => update('lighting.ambient', +e.target.value)} className="w-full" />
          </div>
          <div>
            <label className="text-xs text-[#9aa3bf]">Camera FOV: {cfg.camera.fov}°</label>
            <input type="range" min={30} max={110} step={1} value={cfg.camera.fov} onChange={e => update('camera.fov', +e.target.value)} className="w-full" />
          </div>
          <div>
            <label className="text-xs text-[#9aa3bf]">Camera Angle: {cfg.camera.angle}°</label>
            <input type="range" min={-45} max={45} step={1} value={cfg.camera.angle} onChange={e => update('camera.angle', +e.target.value)} className="w-full" />
          </div>
          <div>
            <label className="text-xs text-[#9aa3bf]">Camera Noise: {cfg.camera.noise.toFixed(3)}</label>
            <input type="range" min={0} max={0.1} step={0.005} value={cfg.camera.noise} onChange={e => update('camera.noise', +e.target.value)} className="w-full" />
          </div>
          <div>
            <label className="text-xs text-[#9aa3bf]">Clutter Count: {cfg.clutter.count}</label>
            <input type="range" min={0} max={20} step={1} value={cfg.clutter.count} onChange={e => update('clutter.count', +e.target.value)} className="w-full" />
          </div>
          <div>
            <label className="text-xs text-[#9aa3bf]">Frames to Generate: {cfg.frames}</label>
            <input type="range" min={10} max={5000} step={10} value={cfg.frames} onChange={e => update('frames', +e.target.value)} className="w-full" />
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={cfg.domainRandomization} onChange={e => update('domainRandomization', e.target.checked)} />
              Domain Randomization
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={cfg.textures.randomize} onChange={e => update('textures.randomize', e.target.checked)} />
              Randomize Textures
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[#9aa3bf]">Seed</label>
              <input className="input" type="number" value={cfg.seed} onChange={e => update('seed', +e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-[#9aa3bf]">Background</label>
              <select className="input" value={cfg.textures.background} onChange={e => update('textures.background', e.target.value)}>
                <option>factory_floor</option><option>conveyor</option><option>warehouse</option><option>lab</option>
              </select>
            </div>
          </div>
          <button className="btn btn-primary w-full" onClick={generate} disabled={generating}>
            {generating ? 'Generating...' : <><Play size={16} /> Generate Dataset</>}
          </button>
          {generated > 0 && <div className="text-xs text-green-400">Generated {generated} frames total across runs.</div>}
        </div>

        <div className="card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-semibold">Preview (seed {seed})</div>
            <button className="btn text-xs" onClick={() => setPreviewSeed(s => s + 1)}><RefreshCw size={12} /> Regenerate</button>
          </div>
          <canvas ref={el => {
            if (!el) return
            const ctx = el.getContext('2d')!; el.width = 480; el.height = 270
            // render randomized scene
            const r = (s: number) => { let x = s; return () => { x = (x * 9301 + 49297) % 233280; return x / 233280 } }
            const rng = r(cfg.seed + seed * 1000)
            const li = cfg.lighting.intensity
            const bg = cfg.textures.background
            const palettes: Record<string, string[]> = { factory_floor: ['#1f2937', '#374151'], conveyor: ['#0f172a', '#1e293b'], warehouse: ['#1c1917', '#292524'], lab: ['#0c4a6e', '#075985'] }
            const [c1, c2] = palettes[bg] ?? palettes.factory_floor
            const g = ctx.createLinearGradient(0, 0, 480, 270)
            g.addColorStop(0, c1); g.addColorStop(1, c2)
            ctx.fillStyle = g; ctx.fillRect(0, 0, 480, 270)
            // lighting overlay
            ctx.fillStyle = `rgba(255,240,200,${(li - 0.5) * 0.15})`
            ctx.fillRect(0, 0, 480, 270)
            // objects
            for (let i = 0; i < 6; i++) {
              const x = rng() * 400 + 20, y = rng() * 200 + 20
              const w = 30 + rng() * 80, h = 30 + rng() * 60
              const hue = cfg.textures.randomize ? rng() * 360 : 220
              ctx.fillStyle = `hsl(${hue}, 60%, ${40 + li * 15}%)`
              ctx.fillRect(x, y, w, h)
              ctx.strokeStyle = `rgba(0,0,0,0.4)`; ctx.strokeRect(x, y, w, h)
            }
            // clutter
            for (let i = 0; i < cfg.clutter.count; i++) {
              const x = rng() * 460, y = rng() * 250
              const s = cfg.clutter.size[0] + rng() * (cfg.clutter.size[1] - cfg.clutter.size[0]) * 100
              ctx.fillStyle = `hsl(${rng() * 360}, 40%, 50%)`
              ctx.fillRect(x, y, s, s)
            }
            // camera noise
            if (cfg.camera.noise > 0) {
              const img = ctx.getImageData(0, 0, 480, 270)
              for (let i = 0; i < img.data.length; i += 4) {
                const n = (Math.random() - 0.5) * cfg.camera.noise * 255
                img.data[i] = Math.min(255, Math.max(0, img.data[i] + n))
                img.data[i + 1] = Math.min(255, Math.max(0, img.data[i + 1] + n))
                img.data[i + 2] = Math.min(255, Math.max(0, img.data[i + 2] + n))
              }
              ctx.putImageData(img, 0, 0)
            }
            // glare
            if (cfg.lighting.intensity > 1.5) {
              const grd = ctx.createRadialGradient(380, 60, 10, 380, 60, 120)
              grd.addColorStop(0, 'rgba(255,255,220,0.6)'); grd.addColorStop(1, 'rgba(255,255,220,0)')
              ctx.fillStyle = grd; ctx.fillRect(0, 0, 480, 270)
            }
          }} style={{ width: '100%', height: 'auto' }} />
          <div className="grid grid-cols-3 gap-2 text-xs text-[#9aa3bf]">
            <div className="card p-2 text-center"><div className="font-semibold text-white">{cfg.frames}</div>frames</div>
            <div className="card p-2 text-center"><div className="font-semibold text-white">{cfg.clutter.count}</div>clutter</div>
            <div className="card p-2 text-center"><div className="font-semibold text-white">{cfg.domainRandomization ? 'ON' : 'OFF'}</div>domain rand</div>
          </div>
        </div>
      </div>
    </div>
  )
}