import { useState } from 'react'
import { useStore } from '../store/useStore'
import { Bot, Send, Loader2 } from 'lucide-react'

interface Msg { role: 'user' | 'assistant'; text: string }

const SUGGESTIONS = [
  'How do I improve recall on small objects?',
  'What is IoU and how is it calculated?',
  'Explain domain randomization for sim-to-real.',
  'How to handle class imbalance?',
  'Summarize my current dataset quality.',
  'What are common annotation pitfalls in robotics?',
]

export default function AIAssistant() {
  const datasets = useStore(s => s.datasets)
  const qaCache = useStore(s => s.qaCache)
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: 'assistant', text: 'Hi! I am your Data Farming AI assistant. Ask me about annotation, QA metrics, synthetic data, or your datasets.' },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const respond = (q: string): string => {
    const lq = q.toLowerCase()
    if (lq.includes('iou')) return 'IoU (Intersection over Union) measures overlap between predicted and ground-truth boxes: IoU = area(intersection) / area(union). A common threshold is 0.5 for a "correct" detection. In robotics, higher IoU (e.g., 0.7+) is preferred for precise manipulation.'
    if (lq.includes('domain randomization') || lq.includes('sim-to-real')) return 'Domain randomization varies lighting, textures, camera angles, and background clutter during simulation so the model learns invariant features and generalizes to the real factory floor. It is key for sim-to-real transfer.'
    if (lq.includes('class imbalance')) return 'Class imbalance biases the model toward majority classes. Mitigate via oversampling minority classes, class-weighted loss, focal loss, or collecting more rare examples. Always monitor per-class precision/recall, not just overall accuracy.'
    if (lq.includes('recall')) return 'Low recall means missed detections (false negatives). In robotics this is a safety risk (e.g., missing an obstacle). Improve by adding hard negatives, lowering confidence threshold carefully, increasing training data for missed classes, and using multi-scale training.'
    if (lq.includes('pitfall') || lq.includes('mistake')) return 'Common pitfalls: inconsistent labels across annotators (label drift), missing occluded objects, out-of-bounds boxes, duplicate frames causing leakage, ignoring temporal consistency, and over-relying on auto-labels without review.'
    if (lq.includes('summarize') || lq.includes('quality')) {
      const cached = Object.entries(qaCache)
      if (cached.length === 0) return 'No QA runs yet. Go to Quality Assurance and run QA on a dataset first.'
      return cached.map(([id, m]) => {
        const ds = datasets.find(d => d.id === id)
        return `${ds?.name ?? id}: IoU ${m.iouMean.toFixed(3)}, Precision ${(m.precision * 100).toFixed(1)}%, Recall ${(m.recall * 100).toFixed(1)}%, F1 ${(m.f1 * 100).toFixed(1)}%, consistency ${(m.labelConsistency * 100).toFixed(1)}%.`
      }).join('\n')
    }
    if (lq.includes('precision')) return 'Precision = TP / (TP + FP). High precision means few false positives (e.g., not falsely detecting an obstacle). Trade-off with recall; tune the confidence threshold based on safety vs. efficiency needs.'
    if (lq.includes('occlusion')) return 'Occlusion handling: annotate partially visible objects with visibility flags (keypoint v=1 for occluded), use amodal bounding boxes, and include occluded examples in training. Domain randomization helps expose the model to varied occlusions.'
    if (lq.includes('format') || lq.includes('coco') || lq.includes('yolo')) return 'COCO: JSON with images, annotations (bbox as [x,y,w,h], segmentation polygons), categories. YOLO: one txt per image with "class x_center y_center width height" normalized 0-1. Use Export Center to generate both.'
    return 'Great question. For robotics data farming, focus on clean multi-modal labels, balanced classes, edge-case coverage, and consistent annotation guidelines. Try asking about IoU, domain randomization, class imbalance, or dataset quality summary.'
  }

  const send = async (text: string) => {
    if (!text.trim()) return
    setMsgs(m => [...m, { role: 'user', text }])
    setInput('')
    setLoading(true)
    await new Promise(r => setTimeout(r, 600))
    const reply = respond(text)
    setMsgs(m => [...m, { role: 'assistant', text: reply }])
    setLoading(false)
  }

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div>
        <h1 className="text-2xl font-bold">AI Assistant</h1>
        <p className="text-[#9aa3bf] text-sm mt-1">Data farming copilot (offline, rule-based; plug in an LLM API key for full power)</p>
      </div>

      <div className="card flex-1 flex flex-col min-h-[400px]">
        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
          {msgs.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm whitespace-pre-wrap ${m.role === 'user' ? 'bg-indigo-500 text-white' : 'bg-[#1a2142] text-[#e6e8f0]'}`}>
                {m.role === 'assistant' && <Bot size={12} className="inline mr-1 text-cyan-400" />}
                {m.text}
              </div>
            </div>
          ))}
          {loading && <div className="flex justify-start"><div className="bg-[#1a2142] px-3 py-2 rounded-xl text-sm"><Loader2 size={14} className="animate-spin inline" /></div></div>}
        </div>
        <div className="border-t border-[#2a325a] p-3">
          <div className="flex gap-2 mb-2 flex-wrap">
            {SUGGESTIONS.map(s => <button key={s} className="btn text-xs" onClick={() => send(s)}>{s}</button>)}
          </div>
          <div className="flex gap-2">
            <input className="input" placeholder="Ask anything..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send(input)} />
            <button className="btn btn-primary" onClick={() => send(input)} disabled={loading}><Send size={16} /></button>
          </div>
        </div>
      </div>
    </div>
  )
}