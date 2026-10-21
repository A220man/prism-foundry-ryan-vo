import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { healthApi } from '../api/client'

export function Dashboard() {
  const [healthy, setHealthy] = useState<boolean | null>(null)
  const [dbHealthy, setDbHealthy] = useState<boolean | null>(null)

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await healthApi.check()
        setHealthy(res.data.status === 'healthy')
      } catch {
        setHealthy(false)
      }
      try {
        const res = await healthApi.dbCheck()
        setDbHealthy(res.data.status === 'healthy')
      } catch {
        setDbHealthy(false)
      }
    }
    checkHealth()
    const interval = setInterval(checkHealth, 30000)
    return () => clearInterval(interval)
  }, [])

  const stats = [
    { label: 'API Status', value: healthy === null ? 'Checking...' : healthy ? 'Healthy' : 'Unhealthy', status: healthy },
    { label: 'Database', value: dbHealthy === null ? 'Checking...' : dbHealthy ? 'Connected' : 'Disconnected', status: dbHealthy },
    { label: 'Version', value: '1.0.0', status: true },
    { label: 'Environment', value: 'Development', status: true },
  ]

  const workflows = [
    { title: 'Market Data Ingestion', description: 'Fetch, store, and manage OHLCV data from multiple sources with pagination and filtering.', path: '/market-data' },
    { title: 'Kronos Predictions', description: 'Generate price predictions using the Kronos foundation model and evaluate with MAE, RMSE, MAPE, Correlation.', path: '/predictions' },
    { title: 'Fine-tuning Workflows', description: 'Configure and track fine-tuning runs for custom symbols with progress monitoring.', path: '/finetune' },
    { title: 'Model Evaluation', description: 'Compare predictions against actuals with comprehensive metrics and visualizations.', path: '/evaluation' },
  ]

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Prism Foundry Dashboard</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '1.125rem' }}>
          Kronos: A Foundation Model for the Language of Financial Markets
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {stats.map((stat, i) => (
          <div key={i} className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: stat.status === null ? 'var(--color-warning)' : stat.status ? 'var(--color-success)' : 'var(--color-danger)' }}>
              {stat.value}
            </div>
            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem' }}>Available Workflows</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {workflows.map((wf, i) => (
            <Link key={i} to={wf.path} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="card" style={{ transition: 'transform 0.15s ease, box-shadow 0.15s ease', height: '100%' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>{wf.title}</h3>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', lineHeight: 1.5 }}>{wf.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginTop: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Quick Actions</h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Link to="/market-data" className="btn btn-primary">Add Market Data</Link>
          <Link to="/predictions" className="btn btn-secondary">Create Prediction</Link>
          <Link to="/finetune" className="btn btn-outline">Start Fine-tuning</Link>
        </div>
      </div>
    </div>
  )
}