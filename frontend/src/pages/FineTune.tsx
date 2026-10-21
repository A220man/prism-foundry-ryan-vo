import { useEffect, useState } from 'react'
import { finetuneApi, FineTuneRun, FineTuneRunCreate, FineTuneRunUpdate } from '../api/client'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { useAppStore } from '../hooks/useAppStore'

const STATUS_COLORS: Record<string, string> = {
  pending: 'badge-warning',
  running: 'badge-info',
  completed: 'badge-success',
  failed: 'badge-danger',
}

export function FineTunePage() {
  const { addToast } = useAppStore()
  const [data, setData] = useState<FineTuneRun[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const [symbolFilter, setSymbolFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingRun, setEditingRun] = useState<FineTuneRun | null>(null)
  const [formData, setFormData] = useState<FineTuneRunCreate>({
    name: '',
    symbol: '',
    base_model: 'kronos-base',
    epochs: 10,
    learning_rate: 0.0001,
    config: { batch_size: 32, seq_len: 120 },
  })
  const [editFormData, setEditFormData] = useState<FineTuneRunUpdate>({})

  const fetchData = async () => {
    setLoading(true)
    try {
      const params: Record<string, string | number> = { page, page_size: pageSize }
      if (symbolFilter) params.symbol = symbolFilter
      if (statusFilter) params.status = statusFilter
      const res = await finetuneApi.list(params)
      setData(res.data.items)
      setTotal(res.data.total)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch fine-tune runs'
      addToast('error', message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [page, pageSize, symbolFilter, statusFilter])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await finetuneApi.create(formData)
      addToast('success', `Created fine-tune run: ${res.data.name}`)
      setShowModal(false)
      setFormData({
        name: '',
        symbol: '',
        base_model: 'kronos-base',
        epochs: 10,
        learning_rate: 0.0001,
        config: { batch_size: 32, seq_len: 120 },
      })
      fetchData()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create fine-tune run'
      addToast('error', message)
    }
  }

  const handleEdit = async (run: FineTuneRun) => {
    setEditingRun(run)
    setEditFormData({
      status: run.status,
      train_loss: run.train_loss ?? undefined,
      val_loss: run.val_loss ?? undefined,
      config: run.config,
      artifacts_path: run.artifacts_path ?? undefined,
      error_message: run.error_message ?? undefined,
    })
    setShowModal(true)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingRun) return
    try {
      const res = await finetuneApi.update(editingRun.id, editFormData)
      addToast('success', `Updated fine-tune run: ${res.data.name}`)
      setEditingRun(null)
      setShowModal(false)
      fetchData()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update fine-tune run'
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
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Fine-tuning Workflows</h1>
        <p style={{ color: 'var(--color-text-muted)' }}>Configure and track fine-tuning runs for custom symbols with progress monitoring</p>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1 1 0%', minWidth: '200px' }}>
            <label className="label">Filter by Symbol</label>
            <input className="input" placeholder="e.g., BTCUSDT" value={symbolFilter} onChange={(e) => setSymbolFilter(e.target.value)} />
          </div>
          <div style={{ flex: '1 1 0%', minWidth: '150px' }}>
            <label className="label">Filter by Status</label>
            <select className="input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="running">Running</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
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
          <button className="btn btn-primary" style={{ height: '38px', alignSelf: 'flex-end' }} onClick={() => { setShowModal(true); setEditingRun(null); }}>
            Create Fine-tune Run
          </button>
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Symbol</th>
                <th>Base Model</th>
                <th>Epochs</th>
                <th>LR</th>
                <th>Status</th>
                <th>Train Loss</th>
                <th>Val Loss</th>
                <th>Started</th>
                <th>Completed</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                    No fine-tune runs found. Create your first run.
                  </td>
                </tr>
              ) : (
                data.map((run) => (
                  <tr key={run.id}>
                    <td>{run.name}</td>
                    <td>{run.symbol}</td>
                    <td>{run.base_model}</td>
                    <td>{run.epochs}</td>
                    <td>{run.learning_rate}</td>
                    <td><span className={`badge ${STATUS_COLORS[run.status] || 'badge-warning'}`}>{run.status}</span></td>
                    <td>{run.train_loss?.toFixed(4) ?? 'N/A'}</td>
                    <td>{run.val_loss?.toFixed(4) ?? 'N/A'}</td>
                    <td>{run.started_at ? new Date(run.started_at).toLocaleString() : 'N/A'}</td>
                    <td>{run.completed_at ? new Date(run.completed_at).toLocaleString() : 'N/A'}</td>
                    <td>
                      <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => handleEdit(run)}>
                        Edit
                      </button>
                    </td>
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
          <div className="card" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflow: 'auto', margin: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem' }}>
              {editingRun ? 'Edit Fine-tune Run' : 'Create Fine-tune Run'}
            </h2>
            <form onSubmit={editingRun ? handleUpdate : handleCreate}>
              {!editingRun && (
                <>
                  <div style={{ marginBottom: '1rem' }}>
                    <label className="label">Name *</label>
                    <input className="input" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                  </div>
                  <div style={{ marginBottom: '1rem' }}>
                    <label className="label">Symbol *</label>
                    <input className="input" value={formData.symbol} onChange={(e) => setFormData({ ...formData, symbol: e.target.value })} required />
                  </div>
                  <div style={{ marginBottom: '1rem' }}>
                    <label className="label">Base Model *</label>
                    <input className="input" value={formData.base_model} onChange={(e) => setFormData({ ...formData, base_model: e.target.value })} required />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <label className="label">Epochs *</label>
                      <input className="input" type="number" min="1" value={formData.epochs} onChange={(e) => setFormData({ ...formData, epochs: Number(e.target.value) })} required />
                    </div>
                    <div>
                      <label className="label">Learning Rate *</label>
                      <input className="input" type="number" step="0.00001" min="0" max="1" value={formData.learning_rate} onChange={(e) => setFormData({ ...formData, learning_rate: Number(e.target.value) })} required />
                    </div>
                    <div>
                      <label className="label">Batch Size</label>
                      <input className="input" type="number" min="1" value={formData.config?.batch_size as number} onChange={(e) => setFormData({ ...formData, config: { ...formData.config, batch_size: Number(e.target.value) } })} />
                    </div>
                    <div>
                      <label className="label">Sequence Length</label>
                      <input className="input" type="number" min="1" value={formData.config?.seq_len as number} onChange={(e) => setFormData({ ...formData, config: { ...formData.config, seq_len: Number(e.target.value) } })} />
                    </div>
                  </div>
                </>
              )}
              {editingRun && (
                <>
                  <div style={{ marginBottom: '1rem' }}>
                    <label className="label">Status</label>
                    <select className="input" value={editFormData.status || ''} onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as FineTuneRunUpdate['status'] })}>
                      <option value="pending">Pending</option>
                      <option value="running">Running</option>
                      <option value="completed">Completed</option>
                      <option value="failed">Failed</option>
                    </select>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <label className="label">Train Loss</label>
                      <input className="input" type="number" step="0.0001" value={editFormData.train_loss ?? ''} onChange={(e) => setEditFormData({ ...editFormData, train_loss: e.target.value ? Number(e.target.value) : undefined })} />
                    </div>
                    <div>
                      <label className="label">Val Loss</label>
                      <input className="input" type="number" step="0.0001" value={editFormData.val_loss ?? ''} onChange={(e) => setEditFormData({ ...editFormData, val_loss: e.target.value ? Number(e.target.value) : undefined })} />
                    </div>
                  </div>
                  <div style={{ marginBottom: '1rem' }}>
                    <label className="label">Error Message</label>
                    <textarea className="input" rows={3} value={editFormData.error_message ?? ''} onChange={(e) => setEditFormData({ ...editFormData, error_message: e.target.value })} />
                  </div>
                  <div style={{ marginBottom: '1rem' }}>
                    <label className="label">Artifacts Path</label>
                    <input className="input" value={editFormData.artifacts_path ?? ''} onChange={(e) => setEditFormData({ ...editFormData, artifacts_path: e.target.value })} />
                  </div>
                  <div style={{ marginBottom: '1rem' }}>
                    <label className="label">Completed At</label>
                    <input className="input" type="datetime-local" value={editFormData.completed_at ?? ''} onChange={(e) => setEditFormData({ ...editFormData, completed_at: e.target.value })} />
                  </div>
                </>
              )}
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => { setShowModal(false); setEditingRun(null); }}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingRun ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}