import { Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { MarketDataPage } from './pages/MarketData'
import { PredictionsPage } from './pages/Predictions'
import { FineTunePage } from './pages/FineTune'
import { EvaluationPage } from './pages/Evaluation'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="market-data" element={<MarketDataPage />} />
        <Route path="predictions" element={<PredictionsPage />} />
        <Route path="finetune" element={<FineTunePage />} />
        <Route path="evaluation" element={<EvaluationPage />} />
      </Route>
    </Routes>
  )
}

export default App