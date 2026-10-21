import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { healthApi } from '../api/client'
import { useAppStore } from '../hooks/useAppStore'
import { LoadingSpinner } from './LoadingSpinner'

export function Navbar() {
  const { sidebarOpen, toggleSidebar, setSidebarOpen } = useAppStore()
  const [healthy, setHealthy] = useState<boolean | null>(null)

  useEffect(() => {
    healthApi.check()
      .then(() => setHealthy(true))
      .catch(() => setHealthy(false))
  }, [])

  const navLinks = [
    { path: '/', label: 'Dashboard' },
    { path: '/market-data', label: 'Market Data' },
    { path: '/predictions', label: 'Predictions' },
    { path: '/finetune', label: 'Fine-tuning' },
    { path: '/evaluation', label: 'Evaluation' },
  ]

  return (
    <header style={{ 
      position: 'sticky', 
      top: 0, 
      zIndex: 100, 
      background: 'var(--color-surface)', 
      borderBottom: '1px solid var(--color-border)',
      boxShadow: 'var(--shadow-sm)'
    }}>
      <nav className="container" style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        height: '64px',
        gap: '1rem'
      }}>
        <Link to="/" style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem', 
          fontWeight: 700, 
          fontSize: '1.25rem',
          color: 'var(--color-text)',
          textDecoration: 'none'
        }}>
          <span style={{ 
            width: '32px', 
            height: '32px', 
            borderRadius: '8px', 
            background: 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 700,
            fontSize: '1rem'
          }}>K</span>
          Prism Foundry
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className={`badge ${healthy === true ? 'badge-success' : healthy === false ? 'badge-danger' : 'badge-warning'}`}>
              {healthy === true ? 'Online' : healthy === false ? 'Offline' : 'Checking...'}
            </span>
            {healthy === null && <LoadingSpinner size="sm" />}
          </div>

          <div style={{ display: 'none' }} className="desktop-nav">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--color-text)',
                  fontWeight: 500,
                  fontSize: '0.875rem',
                  textDecoration: 'none',
                  transition: 'background 0.15s ease',
                }}
                onClick={() => setSidebarOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <button
            className="btn btn-outline"
            onClick={toggleSidebar}
            style={{ display: 'none' }}
            aria-label="Toggle menu"
          >
            ☰
          </button>
        </div>
      </nav>

      <div
        className={`mobile-nav ${sidebarOpen ? 'open' : ''}`}
        style={{
          display: 'none',
          position: 'absolute',
          top: '64px',
          left: 0,
          right: 0,
          background: 'var(--color-surface)',
          borderBottom: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-lg)',
          padding: '1rem',
          flexDirection: 'column',
          gap: '0.5rem',
        }}
      >
        {navLinks.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            style={{
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-text)',
              fontWeight: 500,
              textDecoration: 'none',
            }}
            onClick={() => setSidebarOpen(false)}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </header>
  )
}