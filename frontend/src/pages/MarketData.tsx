import { useEffect, useState } from 'react'
import { marketDataApi, MarketData, MarketDataCreate } from '../api/client'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { useAppStore } from '../hooks/useAppStore'

export function MarketDataPage() {
  const { addToast } = useAppStore()
  const [data, setData] = useState<MarketData[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const [symbolFilter, setSymbolFilter] = useState('')
  const [symbols, setSymbols] = useState<string[]>([])
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState<MarketDataCreate>({
    symbol: '',
    timestamp: new Date().toISOString(),
    open: 0,
    high: 0,
    low: 0,
    close: 0,
    volume: 0,
    source: 'manual',
  })

  const fetchData = async () => {
    setLoading(true)
    try {
      const params: Record<string, string | number> = { page, page_size: pageSize }
      if (symbolFilter) params.symbol = symbolFilter
      const res = await marketDataApi.list(params)
      setData(res.data.items)
      setTotal(res.data.total)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch market data'
      addToast('error', message)
    } finally {
      setLoading(false)
    }
  }

  const fetchSymbols = async () => {
    try {
      const res = await marketDataApi.getSymbols()
      setSymbols(res.data)
    } catch {
      // Ignore symbol fetch errors
    }
  }

  useEffect(() => {
    fetchData()
    fetchSymbols()
  }, [page, pageSize, symbolFilter])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await marketDataApi.create(formData)
      addToast('success', `Created market data for ${res.data.symbol}`)
      setShowModal(false)
      setFormData({
        symbol: '',
        timestamp: new Date().toISOString(),
        open: 0,
        high: 0,
        low: 0,
        close: 0,
        volume: 0,
        source: 'manual',
      })
      fetchData()
      fetchSymbols()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create market data'
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

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Market Data</h1>
        <p style={{ color: 'var(--color-text-muted)' }}>Manage OHLCV data for financial instruments</p>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Data Points</h2>
            <p style={{ color: 'var(--color-text-muted)' }}>View and manage market data</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>Add Data Point</button>
        </div>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1 1 0%', minWidth: '200px' }}>
            <label className="label">Filter by Symbol</label>
            <select className="input" value={symbolFilter} onChange={(e) => setSymbolFilter(e.target.value)}>
              <option value="">All Symbols</option>
              {symbols.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
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
                <th>Timestamp</th>
                <th>Open</th>
                <th>High</th>
                <th>Low</th>
                <th>Close</th>
                <th>Volume</th>
                <th>Source</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                    No market data found. Add your first data point.
                  </td>
                </tr>
              ) : (
                data.map((row) => (
                  <tr key={row.id}>
                    <td>{row.symbol}</td>
                    <td>{new Date(row.timestamp).toLocaleString()}</td>
                    <td>{row.open.toFixed(4)}</td>
                    <td>{row.high.toFixed(4)}</td>
                    <td>{row.low.toFixed(4)}</td>
                    <td>{row.close.toFixed(4)}</td>
                    <td>{row.volume.toFixed(4)}</td>
                    <td>{row.source}</td>
                    <td />
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
          <div className="card" style={{ width: '100%', maxWidth: '500px', maxHeight: '90vh', overflow: 'auto', margin: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem' }}>Add Market Data Point</h2>
            <form onSubmit={handleCreate}>
              <div style={{ marginBottom: '1rem' }}>
                <label className="label">Symbol *</label>
                <input className="input" value={formData.symbol} onChange={(e) => setFormData({ ...formData, symbol: e.target.value })} required />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label className="label">Timestamp *</label>
                <input className="input" type="datetime-local" value={formData.timestamp.slice(0, 16)} onChange={(e) => setFormData({ ...formData, timestamp: new Date(e.target.value).toISOString() })} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label className="label">Open *</label>
                  <input className="input" type="number" step="0.0001" min="0" value={formData.open} onChange={(e) => setFormData({ ...formData, open: Number(e.target.value) })} required />
                </div>
                <div>
                  <label className="label">High *</label>
                  <input className="input" type="number" step="0.0001" min="0" value={formData.high} onChange={(e) => setFormData({ ...formData, high: Number(e.target.value) })} required />
                </div>
                <div>
                  <label className="label">Low *</label>
                  <input className="input" type="number" step="0.0001" min="0" value={formData.low} onChange={(e) => setFormData({ ...formData, low: Number(e.target.value) })} required />
                </div>
                <div>
                  <label className="label">Close *</label>
                  <input className="input" type="number" step="0.0001" min="0" value={formData.close} onChange={(e) => setFormData({ ...formData, close: Number(e.target.value) })} required />
                </div>
                <div>
                  <label className="label">Volume *</label>
                  <input className="input" type="number" step="0.0001" min="0" value={formData.volume} onChange={(e) => setFormData({ ...formData, volume: Number(e.target.value) })} required />
                </div>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label className="label">Source</label>
                <input className="input" value={formData.source} onChange={(e) => setFormData({ ...formData, source: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}