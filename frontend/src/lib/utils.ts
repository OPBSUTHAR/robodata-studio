import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)) }

export function uid(prefix = 'id'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}_${Date.now().toString(36)}`
}

export function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)) }
export function lerp(a: number, b: number, t: number) { return a + (b - a) * t }
export function rand(min: number, max: number) { return min + Math.random() * (max - min) }
export function randInt(min: number, max: number) { return Math.floor(rand(min, max + 1)) }
export function choice<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)] }

export function iou2d(a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }): number {
  const ax2 = a.x + a.w, ay2 = a.y + a.h
  const bx2 = b.x + b.w, by2 = b.y + b.h
  const ix = Math.max(0, Math.min(ax2, bx2) - Math.max(a.x, b.x))
  const iy = Math.max(0, Math.min(ay2, by2) - Math.max(a.y, b.y))
  const inter = ix * iy
  const union = a.w * a.h + b.w * b.h - inter
  return union <= 0 ? 0 : inter / union
}

export function iou3d(a: { center: number[]; size: number[] }, b: { center: number[]; size: number[] }): number {
  // axis-aligned 3D IoU
  let inter = 1
  for (let i = 0; i < 3; i++) {
    const aMin = a.center[i] - a.size[i] / 2, aMax = a.center[i] + a.size[i] / 2
    const bMin = b.center[i] - b.size[i] / 2, bMax = b.center[i] + b.size[i] / 2
    const ov = Math.max(0, Math.min(aMax, bMax) - Math.max(aMin, bMin))
    inter *= ov
  }
  const va = a.size[0] * a.size[1] * a.size[2]
  const vb = b.size[0] * b.size[1] * b.size[2]
  const union = va + vb - inter
  return union <= 0 ? 0 : inter / union
}

export function formatBytes(n: number): string {
  if (n < 1024) return n + ' B'
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB'
  if (n < 1024 * 1024 * 1024) return (n / 1024 / 1024).toFixed(1) + ' MB'
  return (n / 1024 / 1024 / 1024).toFixed(2) + ' GB'
}

export function hashString(s: string): string {
  let h = 0
  for (let i = 0; i < s.length; i++) { h = ((h << 5) - h + s.charCodeAt(i)) | 0 }
  return (h >>> 0).toString(16).padStart(8, '0')
}

export function downloadText(filename: string, text: string, mime = 'text/plain') {
  const blob = new Blob([text], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

export function downloadJSON(filename: string, data: any) {
  downloadText(filename, JSON.stringify(data, null, 2), 'application/json')
}