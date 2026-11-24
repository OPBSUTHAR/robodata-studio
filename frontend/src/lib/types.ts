export type Modality = 'rgb' | 'depth' | 'pointcloud' | 'lidar' | 'thermal'
export type AnnotationType = 'bbox2d' | 'polygon' | 'keypoint' | 'cuboid3d' | 'segmentation3d' | 'action' | 'trajectory'
export type LabelStatus = 'unlabeled' | 'in_progress' | 'labeled' | 'reviewed' | 'rejected'

export interface BBox2D { x: number; y: number; w: number; h: number }
export interface Keypoint { x: number; y: number; v: number } // v: 0=not labeled,1=occluded,2=visible
export interface Cuboid3D { center: [number, number, number]; size: [number, number, number]; rotation: [number, number, number] }
export interface Point3D { x: number; y: number; z: number; r?: number; g?: number; b?: number; intensity?: number; label?: number }

export interface Annotation {
  id: string
  frameId: string
  type: AnnotationType
  classId: number
  className: string
  bbox?: BBox2D
  polygon?: { x: number; y: number }[]
  keypoints?: Keypoint[]
  cuboid?: Cuboid3D
  mask?: number[][] // binary mask
  action?: { startFrame: number; endFrame: number; action: string }
  trajectory?: { x: number; y: number; t: number }[]
  confidence?: number
  annotator?: string
  createdAt: number
  status: LabelStatus
}

export interface Frame {
  id: string
  datasetId: string
  index: number
  timestamp: number
  modalities: Modality[]
  rgbUrl?: string
  depthUrl?: string
  imageUrl?: string
  width: number
  height: number
  scene: string
  lighting: 'bright' | 'dim' | 'glare' | 'low_light' | 'night'
  occlusionLevel: number // 0-1
  hasDynamicObstacle: boolean
  pointCloud?: Point3D[]
  metadata: Record<string, any>
}

export interface Dataset {
  id: string
  name: string
  description: string
  version: string
  modality: Modality[]
  classes: { id: number; name: string; color: string }[]
  frameCount: number
  annotatedCount: number
  createdAt: number
  updatedAt: number
  tags: string[]
  source: 'real' | 'synthetic' | 'mixed'
  license: string
}

export interface DatasetVersion {
  id: string
  datasetId: string
  version: string
  createdAt: number
  frameCount: number
  changes: string
  hash: string
}

export interface QAMetrics {
  iouMean: number
  precision: number
  recall: number
  f1: number
  classImbalance: Record<string, number>
  labelConsistency: number // 0-1
  duplicateFrames: number
  missingLabels: number
  outOfBounds: number
}

export interface EdgeCase {
  frameId: string
  type: 'occlusion' | 'glare' | 'low_light' | 'motion_blur' | 'truncation' | 'crowding' | 'dynamic_obstacle'
  severity: 'low' | 'medium' | 'high'
  score: number
  description: string
}

export interface SyntheticConfig {
  lighting: { intensity: number; color: [number, number, number]; ambient: number }
  camera: { fov: number; angle: number; distance: number; noise: number }
  textures: { background: string; objectMaterial: string; randomize: boolean }
  clutter: { count: number; size: [number, number] }
  domainRandomization: boolean
  seed: number
  frames: number
}