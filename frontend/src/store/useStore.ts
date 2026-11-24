import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Dataset, Frame, Annotation, DatasetVersion, SyntheticConfig, QAMetrics } from '../lib/types'
import { generateDatasets, generateFrames, generateAnnotations, generateVersions } from '../lib/mockData'
import { uid } from '../lib/utils'

interface State {
  datasets: Dataset[]
  framesByDataset: Record<string, Frame[]>
  annotationsByFrame: Record<string, Annotation[]>
  versionsByDataset: Record<string, DatasetVersion[]>
  qaCache: Record<string, QAMetrics>
  syntheticConfig: SyntheticConfig
  selectedDatasetId: string | null
  selectedFrameId: string | null
  init: () => void
  selectDataset: (id: string | null) => void
  selectFrame: (id: string | null) => void
  loadFrames: (datasetId: string, n?: number) => void
  addAnnotation: (ann: Annotation) => void
  updateAnnotation: (id: string, patch: Partial<Annotation>) => void
  deleteAnnotation: (id: string, frameId: string) => void
  runQA: (datasetId: string) => QAMetrics
  createVersion: (datasetId: string, changes: string) => void
  addDataset: (d: Dataset) => void
  setSyntheticConfig: (c: Partial<SyntheticConfig>) => void
  autoAnnotate: (frameId: string) => number
}

const defaultSynth: SyntheticConfig = {
  lighting: { intensity: 1.0, color: [1, 1, 1], ambient: 0.4 },
  camera: { fov: 60, angle: 15, distance: 1.5, noise: 0.02 },
  textures: { background: 'factory_floor', objectMaterial: 'metal', randomize: true },
  clutter: { count: 5, size: [0.05, 0.15] },
  domainRandomization: true,
  seed: 42,
  frames: 100,
}

export const useStore = create<State>()(persist((set, get) => ({
  datasets: [],
  framesByDataset: {},
  annotationsByFrame: {},
  versionsByDataset: {},
  qaCache: {},
  syntheticConfig: defaultSynth,
  selectedDatasetId: null,
  selectedFrameId: null,
  init: () => {
    if (get().datasets.length) return
    const ds = generateDatasets()
    const versions: Record<string, DatasetVersion[]> = {}
    ds.forEach(d => { versions[d.id] = generateVersions(d.id) })
    set({ datasets: ds, versionsByDataset: versions })
  },
  selectDataset: (id) => set({ selectedDatasetId: id, selectedFrameId: null }),
  selectFrame: (id) => set({ selectedFrameId: id }),
  loadFrames: (datasetId, n = 60) => {
    if (get().framesByDataset[datasetId]) return
    const ds = get().datasets.find(d => d.id === datasetId)
    const count = Math.min(n, ds?.frameCount ?? n)
    const frames = generateFrames(datasetId, count)
    const anns: Record<string, Annotation[]> = { ...get().annotationsByFrame }
    frames.forEach(f => {
      if (!anns[f.id]) anns[f.id] = Math.random() < 0.5 ? generateAnnotations(f, ds?.classes ?? []) : []
    })
    set({ framesByDataset: { ...get().framesByDataset, [datasetId]: frames }, annotationsByFrame: anns })
  },
  addAnnotation: (ann) => set(s => ({
    annotationsByFrame: { ...s.annotationsByFrame, [ann.frameId]: [...(s.annotationsByFrame[ann.frameId] ?? []), ann] }
  })),
  updateAnnotation: (id, patch) => set(s => {
    const out = { ...s.annotationsByFrame }
    for (const k in out) out[k] = out[k].map(a => a.id === id ? { ...a, ...patch } : a)
    return { annotationsByFrame: out }
  }),
  deleteAnnotation: (id, frameId) => set(s => ({
    annotationsByFrame: { ...s.annotationsByFrame, [frameId]: (s.annotationsByFrame[frameId] ?? []).filter(a => a.id !== id) }
  })),
  runQA: (datasetId) => {
    const frames = get().framesByDataset[datasetId] ?? []
    const ds = get().datasets.find(d => d.id === datasetId)
    const classes = ds?.classes ?? []
    let iouSum = 0, iouN = 0
    let missing = 0, oob = 0, dup = 0
    const classCounts: Record<string, number> = {}
    classes.forEach(c => classCounts[c.name] = 0)
    const frameHashes = new Set<string>()
    frames.forEach(f => {
      const anns = get().annotationsByFrame[f.id] ?? []
      if (anns.length === 0) missing++
      anns.forEach(a => {
        if (a.bbox) {
          const b = a.bbox
          if (b.x < 0 || b.y < 0 || b.x + b.w > f.width || b.y + b.h > f.height) oob++
        }
        classCounts[a.className] = (classCounts[a.className] ?? 0) + 1
        // synthetic iou vs pseudo-gt
        iouSum += 0.5 + Math.random() * 0.45
        iouN++
      })
      const h = f.scene + f.lighting + anns.length
      if (frameHashes.has(h)) dup++
      frameHashes.add(h)
    })
    const total = Object.values(classCounts).reduce((a, b) => a + b, 0) || 1
    const imbalance: Record<string, number> = {}
    Object.keys(classCounts).forEach(k => imbalance[k] = classCounts[k] / total)
    const metrics: QAMetrics = {
      iouMean: iouN ? iouSum / iouN : 0,
      precision: 0.78 + Math.random() * 0.18,
      recall: 0.72 + Math.random() * 0.22,
      f1: 0,
      classImbalance: imbalance,
      labelConsistency: 0.82 + Math.random() * 0.15,
      duplicateFrames: dup,
      missingLabels: missing,
      outOfBounds: oob,
    }
    metrics.f1 = 2 * metrics.precision * metrics.recall / (metrics.precision + metrics.recall)
    set(s => ({ qaCache: { ...s.qaCache, [datasetId]: metrics } }))
    return metrics
  },
  createVersion: (datasetId, changes) => set(s => {
    const versions = s.versionsByDataset[datasetId] ?? []
    const last = versions[versions.length - 1]
    const nextMinor = last ? (parseFloat(last.version) + 0.1).toFixed(1) : '1.0.0'
    const v = { id: uid('ver'), datasetId, version: nextMinor, createdAt: Date.now(), frameCount: (s.framesByDataset[datasetId] ?? []).length, changes, hash: uid('hash') }
    return { versionsByDataset: { ...s.versionsByDataset, [datasetId]: [...versions, v] } }
  }),
  addDataset: (d) => set(s => ({ datasets: [...s.datasets, d] })),
  setSyntheticConfig: (c) => set(s => ({ syntheticConfig: { ...s.syntheticConfig, ...c } })),
  autoAnnotate: (frameId) => {
    const frame = Object.values(get().framesByDataset).flat().find(f => f.id === frameId)
    const ds = get().datasets.find(d => d.id === frame?.datasetId)
    const classes = ds?.classes ?? []
    const anns = generateAnnotations(frame!, classes).map(a => ({ ...a, annotator: 'auto_yolo', status: 'labeled' as const, confidence: 0.6 + Math.random() * 0.35 }))
    set(s => ({ annotationsByFrame: { ...s.annotationsByFrame, [frameId]: [...(s.annotationsByFrame[frameId] ?? []), ...anns] } }))
    return anns.length
  },
}), { name: 'robodata-store' }))