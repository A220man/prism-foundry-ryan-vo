import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'
import { ToastContainer } from './Toast'

export function Layout() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <main className="container" style={{ flex: 1, paddingTop: '2rem', paddingBottom: '2rem', width: '100%' }}>
        <Outlet />
      </main>
      <footer style={{ 
        padding: '1.5rem', 
        borderTop: '1px solid var(--color-border)', 
        background: 'var(--color-surface)',
        marginTop: 'auto'
      }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            Prism Foundry - Kronos: A Foundation Model for the Language of Financial Markets
          </p>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            Ryan Vo {'<'}ryandtvo@gmail.com{'>'}
          </p>
        </div>
      </footer>
      <ToastContainer />
    </div>
  )
}