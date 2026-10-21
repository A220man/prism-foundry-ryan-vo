import { useEffect, useState } from 'react'
import { predictionsApi, Prediction, PredictionCreate, EvaluationResult } from '../api/client'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { useAppStore } from '../hooks/useAppStore'

export function PredictionsPage() {
  const { addToast } = useAppStore()
  const [data, setData] = useState<Prediction[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const [symbolFilter, setSymbolFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [evalModal, setEvalModal] = useState<{ predicted: number[]; actual: number[] } | null>(null)
  const [evalResult, setEvalResult] = useState<EvaluationResult | null>(null)
  const [formData, setFormData] = useState<PredictionCreate>({
    symbol: '',
    context_start: new Date().toISOString(),
    context_end: new Date().toISOString(),
    prediction_start: new Date().toISOString(),
    prediction_end: new Date().toISOString(),
    predicted_values: [],
    actual_values: [],
    model_version: 'kronos-v1',
  })

  const fetchData = async () => {
    setLoading(true)
    try {
      const params: Record<string, string | number> = { page, page_size: pageSize }
      if (symbolFilter) params.symbol = symbolFilter
      const res = await predictionsApi.list(params)
      setData(res.data.items)
      setTotal(res.data.total)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch predictions'
      addToast('error', message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [page, pageSize, symbolFilter])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await predictionsApi.create(formData)
      addToast('success', `Created prediction for ${res.data.symbol}`)
      setShowModal(false)
      setFormData({
        symbol: '',
        context_start: new Date().toISOString(),
        context_end: new Date().toISOString(),
        prediction_start: new Date().toISOString(),
        prediction_end: new Date().toISOString(),
        predicted_values: [],
        actual_values: [],
        model_version: 'kronos-v1',
      })
      fetchData()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create prediction'
      addToast('error', message)
    }
  }

  if (loading && data.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const actualValues = formData.actual_values ?? []

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Predictions</h1>
        <p style={{ color: 'var(--color-text-muted)' }}>Kronos model predictions with evaluation metrics</p>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Predictions</h2>
            <p style={{ color: 'var(--color-text-muted)' }}>View and manage model predictions</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>Create Prediction</button>
        </div>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1 1 0%', minWidth: '200px' }}>
            <label className="label">Filter by Symbol</label>
            <input className="input" placeholder="e.g., BTCUSDT" value={symbolFilter} onChange={(e) => setSymbolFilter(e.target.value)} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label className="label" style={{ marginBottom: '0px' }}>Page Size</label>
            <select className="input" style={{ width: 'auto' }} value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Context</th>
                <th>Prediction Window</th>
                <th>Points</th>
                <th>MAE</th>
                <th>RMSE</th>
                <th>MAPE %</th>
                <th>Correlation</th>
                <th>Model</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                    No predictions yet. Create your first prediction.
                  </td>
                </tr>
              ) : (
                data.map((row) => (
                  <tr key={row.id}>
                    <td>{row.symbol}</td>
                    <td>{new Date(row.context_start).toLocaleString()} - {new Date(row.context_end).toLocaleString()}</td>
                    <td>{new Date(row.prediction_start).toLocaleString()} - {new Date(row.prediction_end).toLocaleString()}</td>
                    <td>{row.predicted_values.length}</td>
                    <td>{row.mae?.toFixed(4) ?? 'N/A'}</td>
                    <td>{row.rmse?.toFixed(4) ?? 'N/A'}</td>
                    <td>{row.mape?.toFixed(2) ?? 'N/A'}</td>
                    <td>{row.correlation?.toFixed(4) ?? 'N/A'}</td>
                    <td>{row.model_version}</td>
                    <td>{new Date(row.created_at).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {total > pageSize && (
          <div className="pagination">
            <button className="page-btn" onClick={() => setPage(page - 1)} disabled={page <= 1}>Prev</button>
            {Array.from({ length: Math.min(5, Math.ceil(total / pageSize)) }, (_, i) => {
              const pageNum = Math.max(1, Math.min(page - 2, Math.ceil(total / pageSize) - 4)) + i
              return (
                <button key={pageNum} className={`page-btn ${page === pageNum ? 'active' : ''}`} onClick={() => setPage(pageNum)}>
                  {pageNum}
                </button>
              )
            })}
            <button className="page-btn" onClick={() => setPage(page + 1)} disabled={page >= Math.ceil(total / pageSize)}>Next</button>
          </div>
        )}
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '100%', maxWidth: '700px', maxHeight: '90vh', overflow: 'auto', margin: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem' }}>Create Prediction</h2>
            <form onSubmit={handleCreate}>
              <div style={{ marginBottom: '1rem' }}>
                <label className="label">Symbol *</label>
                <input className="input" value={formData.symbol} onChange={(e) => setFormData({ ...formData, symbol: e.target.value })} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label className="label">Context Start *</label>
                  <input className="input" type="datetime-local" value={formData.context_start.slice(0, 16)} onChange={(e) => setFormData({ ...formData, context_start: new Date(e.target.value).toISOString() })} required />
                </div>
                <div>
                  <label className="label">Context End *</label>
                  <input className="input" type="datetime-local" value={formData.context_end.slice(0, 16)} onChange={(e) => setFormData({ ...formData, context_end: new Date(e.target.value).toISOString() })} required />
                </div>
                <div>
                  <label className="label">Prediction Start *</label>
                  <input className="input" type="datetime-local" value={formData.prediction_start.slice(0, 16)} onChange={(e) => setFormData({ ...formData, prediction_start: new Date(e.target.value).toISOString() })} required />
                </div>
                <div>
                  <label className="label">Prediction End *</label>
                  <input className="input" type="datetime-local" value={formData.prediction_end.slice(0, 16)} onChange={(e) => setFormData({ ...formData, prediction_end: new Date(e.target.value).toISOString() })} required />
                </div>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label className="label">Predicted Values (comma-separated) *</label>
                <textarea className="input" rows={3} placeholder="50100.0, 50200.0, 50300.0" value={formData.predicted_values.join(', ')} onChange={(e) => setFormData({ ...formData, predicted_values: e.target.value.split(',').map(v => Number(v.trim())).filter(v => !isNaN(v)) })} required />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label className="label">Actual Values (comma-separated, optional)</label>
                <textarea className="input" rows={3} placeholder="50050.0, 50150.0, 50250.0" value={actualValues.join(', ')} onChange={(e) => setFormData({ ...formData, actual_values: e.target.value.split(',').map(v => Number(v.trim())).filter(v => !isNaN(v)) })} />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label className="label">Model Version</label>
                <input className="input" value={formData.model_version} onChange={(e) => setFormData({ ...formData, model_version: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {evalModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px', margin: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem' }}>Evaluation Result</h2>
            {evalResult && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="card" style={{ background: 'var(--color-bg)', padding: '1rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                    {evalResult.mae !== null ? evalResult.mae.toFixed(4) : 'N/A'}
                  </div>
                  <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>MAE</div>
                </div>
                <div className="card" style={{ background: 'var(--color-bg)', padding: '1rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                    {evalResult.rmse !== null ? evalResult.rmse.toFixed(4) : 'N/A'}
                  </div>
                  <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>RMSE</div>
                </div>
                <div className="card" style={{ background: 'var(--color-bg)', padding: '1rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                    {evalResult.mape !== null ? evalResult.mape.toFixed(2) + '%' : 'N/A'}
                  </div>
                  <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>MAPE</div>
                </div>
                <div className="card" style={{ background: 'var(--color-bg)', padding: '1rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                    {evalResult.correlation !== null ? evalResult.correlation.toFixed(4) : 'N/A'}
                  </div>
                  <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Correlation</div>
                </div>
              </div>
            )}
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button className="btn btn-primary" onClick={() => { setEvalModal(null); setEvalResult(null); }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}