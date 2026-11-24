import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useStore } from './store/useStore'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Datasets from './pages/Datasets'
import DatasetDetail from './pages/DatasetDetail'
import AnnotationStudio from './pages/AnnotationStudio'
import Synthetic from './pages/Synthetic'
import QA from './pages/QA'
import EdgeCases from './pages/EdgeCases'
import ExportCenter from './pages/ExportCenter'
import PublicDataHub from './pages/PublicDataHub'
import AIAssistant from './pages/AIAssistant'

export default function App() {
  const init = useStore(s => s.init)
  useEffect(() => { init() }, [init])
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/datasets" element={<Datasets />} />
        <Route path="/datasets/:id" element={<DatasetDetail />} />
        <Route path="/annotate" element={<AnnotationStudio />} />
        <Route path="/annotate/:frameId" element={<AnnotationStudio />} />
        <Route path="/synthetic" element={<Synthetic />} />
        <Route path="/qa" element={<QA />} />
        <Route path="/edgecases" element={<EdgeCases />} />
        <Route path="/export" element={<ExportCenter />} />
        <Route path="/publicdata" element={<PublicDataHub />} />
        <Route path="/ai" element={<AIAssistant />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}