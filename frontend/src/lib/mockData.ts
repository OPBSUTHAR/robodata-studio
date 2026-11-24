import type { Dataset, Frame, Annotation, Point3D, DatasetVersion } from './types'
import { uid, rand, randInt, choice, hashString } from './utils'

const CLASSES = [
  { id: 1, name: 'robot_arm', color: '#6366f1' },
  { id: 2, name: 'gripper', color: '#22d3ee' },
  { id: 3, name: 'workpiece', color: '#22c55e' },
  { id: 4, name: 'conveyor', color: '#f59e0b' },
  { id: 5, name: 'human_hand', color: '#ef4444' },
  { id: 6, name: 'tool', color: '#a855f7' },
  { id: 7, name: 'obstacle', color: '#f97316' },
  { id: 8, name: 'bin', color: '#14b8a6' },
]

const SCENES = ['assembly_line', 'pick_and_place', 'inspection', 'packaging', 'welding_cell', 'mobile_nav']
const LIGHTINGS: Frame['lighting'][] = ['bright', 'dim', 'glare', 'low_light', 'night']

export function generateDatasets(): Dataset[] {
  const names = [
    'DianaArm_Manipulation_v1',
    'MobileRobot_Navigation',
    'Humanoid_Grasp_Sim',
    'Conveyor_Inspection',
    'Synthetic_DomainRand_v2',
    'EdgeCases_Occlusion_Set',
  ]
  return names.map((n, i) => {
    const fc = [2400, 1800, 3200, 1500, 5000, 900][i]
    const ann = Math.floor(fc * (0.3 + i * 0.1))
    return {
      id: `ds_${i + 1}`,
      name: n,
      description: `${n} dataset for perception & manipulation training.`,
      version: i % 2 === 0 ? '1.2.0' : '2.0.1',
      modality: i % 3 === 0 ? ['rgb', 'depth', 'pointcloud'] : i % 3 === 1 ? ['rgb', 'depth'] : ['rgb', 'pointcloud', 'lidar'],
      classes: CLASSES.slice(0, 4 + (i % 4)),
      frameCount: fc,
      annotatedCount: ann,
      createdAt: Date.now() - (i + 1) * 86400000 * 12,
      updatedAt: Date.now() - i * 86400000 * 3,
      tags: ['robotics', i % 2 ? 'sim' : 'real', i % 3 ? 'indoor' : 'factory'],
      source: (i % 2 === 0 ? 'real' : i % 3 === 0 ? 'synthetic' : 'mixed') as any,
      license: 'Internal',
    }
  })
}

export function generateFrames(datasetId: string, count: number): Frame[] {
  const frames: Frame[] = []
  for (let i = 0; i < count; i++) {
    const lighting = choice(LIGHTINGS)
    const occl = Math.random() < 0.25 ? rand(0.3, 0.85) : rand(0, 0.2)
    frames.push({
      id: `fr_${datasetId}_${i}`,
      datasetId,
      index: i,
      timestamp: Date.now() - (count - i) * 100,
      modalities: ['rgb', 'depth', 'pointcloud'],
      rgbUrl: undefined,
      depthUrl: undefined,
      width: 1280,
      height: 720,
      scene: choice(SCENES),
      lighting,
      occlusionLevel: occl,
      hasDynamicObstacle: Math.random() < 0.15,
      pointCloud: generatePointCloud(200 + randInt(0, 300)),
      metadata: { camera: 'realsense_d455', fps: 30, robot: choice(['diana7', 'mobile_amr', 'humanoid']) },
    })
  }
  return frames
}

export function generatePointCloud(n: number): Point3D[] {
  const pts: Point3D[] = []
  for (let i = 0; i < n; i++) {
    // cluster around a few objects
    const cluster = randInt(0, 3)
    const cx = [0, 0.5, -0.4, 0.2][cluster]
    const cy = [0, 0.2, -0.1, 0.4][cluster]
    const cz = [1.0, 1.2, 0.9, 1.1][cluster]
    pts.push({
      x: cx + (Math.random() - 0.5) * 0.3,
      y: cy + (Math.random() - 0.5) * 0.3,
      z: cz + (Math.random() - 0.5) * 0.3,
      r: randInt(50, 255),
      g: randInt(50, 255),
      b: randInt(50, 255),
      intensity: Math.random(),
      label: cluster + 1,
    })
  }
  return pts
}

export function generateAnnotations(frame: Frame, classes: { id: number; name: string; color: string }[]): Annotation[] {
  const n = randInt(1, 4)
  const anns: Annotation[] = []
  for (let i = 0; i < n; i++) {
    const cls = choice(classes)
    const type = choice(['bbox2d', 'polygon', 'keypoint', 'cuboid3d']) as any
    const x = rand(50, frame.width - 150)
    const y = rand(50, frame.height - 150)
    const w = rand(60, 200)
    const h = rand(60, 200)
    const ann: Annotation = {
      id: uid('ann'),
      frameId: frame.id,
      type,
      classId: cls.id,
      className: cls.name,
      confidence: rand(0.7, 0.99),
      annotator: choice(['auto_yolo', 'human_1', 'human_2', 'sam']),
      createdAt: frame.timestamp + randInt(0, 5000),
      status: Math.random() < 0.6 ? 'labeled' : Math.random() < 0.5 ? 'reviewed' : 'in_progress',
    }
    if (type === 'bbox2d') ann.bbox = { x, y, w, h }
    if (type === 'polygon') {
      ann.polygon = []
      const cx = x + w / 2, cy = y + h / 2
      const r = Math.min(w, h) / 2
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * Math.PI * 2
        ann.polygon.push({ x: cx + Math.cos(a) * r * rand(0.8, 1.2), y: cy + Math.sin(a) * r * rand(0.8, 1.2) })
      }
    }
    if (type === 'keypoint') {
      ann.keypoints = []
      for (let k = 0; k < 17; k++) {
        ann.keypoints.push({ x: x + rand(0, w), y: y + rand(0, h), v: choice([0, 1, 2, 2, 2]) })
      }
    }
    if (type === 'cuboid3d') {
      ann.cuboid = {
        center: [rand(-0.5, 0.5), rand(0, 0.5), rand(0.8, 1.5)],
        size: [rand(0.1, 0.4), rand(0.1, 0.4), rand(0.1, 0.4)],
        rotation: [0, rand(-0.5, 0.5), 0],
      }
    }
    anns.push(ann)
  }
  return anns
}

export function generateVersions(datasetId: string): DatasetVersion[] {
  return [
    { id: uid('ver'), datasetId, version: '1.0.0', createdAt: Date.now() - 60 * 86400000, frameCount: 1200, changes: 'Initial collection', hash: hashString(datasetId + '1.0') },
    { id: uid('ver'), datasetId, version: '1.1.0', createdAt: Date.now() - 30 * 86400000, frameCount: 1800, changes: 'Added depth modality + QA pass', hash: hashString(datasetId + '1.1') },
    { id: uid('ver'), datasetId, version: '1.2.0', createdAt: Date.now() - 7 * 86400000, frameCount: 2400, changes: 'Domain randomization expansion', hash: hashString(datasetId + '1.2') },
  ]
}

export { CLASSES, SCENES, LIGHTINGS }