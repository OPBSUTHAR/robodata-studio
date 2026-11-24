const BASE = (import.meta as any).env?.VITE_API_URL || ''
export async function api<T = any>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { headers: { 'Content-Type': 'application/json' }, ...init })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json()
}
export const get = <T = any>(p: string) => api<T>(p)
export const post = <T = any>(p: string, body?: any) => api<T>(p, { method: 'POST', body: body ? JSON.stringify(body) : undefined })
export const del = <T = any>(p: string) => api<T>(p, { method: 'DELETE' })