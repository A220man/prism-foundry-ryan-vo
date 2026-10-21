import { useEffect, useState } from 'react'
import { predictionsApi, Prediction } from '../api/client'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface EvaluationPoint {
  index: number
  predicted: number
  actual: number
}

export function EvaluationPage() {
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPrediction, setSelectedPrediction] = useState<Prediction | null>(null)
  const [chartData, setChartData] = useState<EvaluationPoint[]>([])
  const [metrics, setMetrics] = useState<{ mae: number | null; rmse: number | null; mape: number | null; correlation: number | null }>({
    mae: null, rmse: null, mape: null, correlation: null
  })

  const fetchPredictions = async () => {
    try {
      const res = await predictionsApi.list({ page_size: 100 })
      setPredictions(res.data.items)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch predictions'
      console.error(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPredictions()
    const interval = setInterval(fetchPredictions, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (selectedPrediction) {
      const predVals = selectedPrediction.predicted_values
      const actualVals = selectedPrediction.actual_values || []
      const points: EvaluationPoint[] = predVals.map((p, i) => ({
        index: i,
        predicted: p,
        actual: actualVals[i] ?? NaN,
      }))
      setChartData(points)
      setMetrics({
        mae: selectedPrediction.mae,
        rmse: selectedPrediction.rmse,
        mape: selectedPrediction.mape,
        correlation: selectedPrediction.correlation,
      })
    }
  }, [selectedPrediction])

  if (loading && predictions.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Model Evaluation</h1>
        <p style={{ color: 'var(--color-text-muted)' }}>Compare predictions against actuals with comprehensive metrics</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
        <div className="card">
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>Predictions</h2>
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {predictions.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📊</div>
                <p>No predictions available</p>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Create predictions to evaluate them</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Symbol</th>
                    <th>Context</th>
                    <th>Window</th>
                    <th>Points</th>
                    <th>MAE</th>
                    <th>RMSE</th>
                    <th>Correlation</th>
                  </tr>
                </thead>
                <tbody>
                  {predictions.map((pred) => (
                    <tr key={pred.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedPrediction(pred)}>
                      <td>{pred.symbol}</td>
                      <td>{new Date(pred.context_start).toLocaleString()}</td>
                      <td>{new Date(pred.prediction_start).toLocaleString()} - {new Date(pred.prediction_end).toLocaleString()}</td>
                      <td>{pred.predicted_values.length}</td>
                      <td>{pred.mae?.toFixed(4) ?? 'N/A'}</td>
                      <td>{pred.rmse?.toFixed(4) ?? 'N/A'}</td>
                      <td>{pred.correlation?.toFixed(4) ?? 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="card">
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>
            {selectedPrediction ? `Evaluation: ${selectedPrediction.symbol}` : 'Select a prediction'}
          </h2>
          {selectedPrediction ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="card" style={{ background: 'var(--color-bg)', padding: '1rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                    {metrics.mae !== null ? metrics.mae.toFixed(4) : 'N/A'}
                  </div>
                  <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>MAE</div>
                </div>
                <div className="card" style={{ background: 'var(--color-bg)', padding: '1rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                    {metrics.rmse !== null ? metrics.rmse.toFixed(4) : 'N/A'}
                  </div>
                  <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>RMSE</div>
                </div>
                <div className="card" style={{ background: 'var(--color-bg)', padding: '1rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                    {metrics.mape !== null ? metrics.mape.toFixed(2) + '%' : 'N/A'}
                  </div>
                  <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>MAPE</div>
                </div>
                <div className="card" style={{ background: 'var(--color-bg)', padding: '1rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                    {metrics.correlation !== null ? metrics.correlation.toFixed(4) : 'N/A'}
                  </div>
                  <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Correlation</div>
                </div>
              </div>

              <div style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="index" stroke="var(--color-text-muted)" />
                    <YAxis stroke="var(--color-text-muted)" />
                    <Tooltip 
                      labelFormatter={(index) => `Point ${index}`}
                      formatter={(value: number, name: string) => [value.toFixed(4), name]}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="predicted" stroke="var(--color-primary)" name="Predicted" dot={false} />
                    <Line type="monotone" dataKey="actual" stroke="var(--color-success)" name="Actual" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--color-bg)', borderRadius: '8px' }}>
                <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Prediction Details</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                  Context: {new Date(selectedPrediction.context_start).toLocaleString()} - {new Date(selectedPrediction.context_end).toLocaleString()}
                </p>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                  Prediction Window: {new Date(selectedPrediction.prediction_start).toLocaleString()} - {new Date(selectedPrediction.prediction_end).toLocaleString()}
                </p>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                  Model: {selectedPrediction.model_version} | Points: {selectedPrediction.predicted_values.length}
                </p>
              </div>
            </>
          ) : (
            <div className="empty-state" style={{ height: '300px', justifyContent: 'center', alignItems: 'center' }}>
              <div className="empty-state-icon">📈</div>
              <p>Select a prediction from the list to view evaluation metrics and charts</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}