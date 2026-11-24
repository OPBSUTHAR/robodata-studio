import { NavLink, Outlet } from 'react-router-dom'
import { Database, LayoutDashboard, PenTool, Sparkles, ShieldCheck, AlertTriangle, Download, Bot, Menu, X } from 'lucide-react'
import { useState } from 'react'

const nav = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/datasets', icon: Database, label: 'Datasets' },
  { to: '/annotate', icon: PenTool, label: 'Annotation Studio' },
  { to: '/synthetic', icon: Sparkles, label: 'Synthetic Data' },
  { to: '/qa', icon: ShieldCheck, label: 'Quality Assurance' },
  { to: '/edgecases', icon: AlertTriangle, label: 'Edge Cases' },
  { to: '/export', icon: Download, label: 'Export Center' },
  { to: '/ai', icon: Bot, label: 'AI Assistant' },
]

export default function Layout() {
  const [open, setOpen] = useState(false)
  return (
    <div className="flex h-full">
      {/* sidebar */}
      <aside className={`fixed md:static z-30 inset-y-0 left-0 w-64 bg-[#0e1428] border-r border-[#2a325a] flex flex-col transition-transform ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-5 border-b border-[#2a325a]">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center font-bold text-white">R</div>
            <div>
              <div className="font-bold text-sm">RoboData Studio</div>
              <div className="text-[11px] text-[#9aa3bf]">Perception Data Farming</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {nav.map(n => (
            <NavLink key={n.to} to={n.to} end={n.to === '/'}
              className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${isActive ? 'bg-indigo-500/20 text-indigo-300 font-medium' : 'text-[#9aa3bf] hover:bg-[#1a2142] hover:text-white'}`}
              onClick={() => setOpen(false)}>
              <n.icon size={18} /> {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-[#2a325a] text-[11px] text-[#9aa3bf]">
          <div>Agile Robots · Data Farming</div>
          <div className="mt-1">v1.0.0 · OPBSUTHAR</div>
        </div>
      </aside>
      {open && <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={() => setOpen(false)} />}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-[#2a325a] flex items-center px-4 gap-3 bg-[#0e1428]/60 backdrop-blur">
          <button className="md:hidden btn btn-ghost" onClick={() => setOpen(o => !o)}>{open ? <X size={18}/> : <Menu size={18}/>}</button>
          <div className="text-sm text-[#9aa3bf]">Robotics Perception Data Platform</div>
          <div className="ml-auto flex items-center gap-2">
            <span className="badge badge-success">● Online</span>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}