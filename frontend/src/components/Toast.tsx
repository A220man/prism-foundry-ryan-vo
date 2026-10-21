import { useEffect } from 'react'
import { useAppStore } from '../hooks/useAppStore'

export function ToastContainer() {
  const { toasts, removeToast } = useAppStore()

  useEffect(() => {
    toasts.forEach((toast) => {
      const timer = setTimeout(() => removeToast(toast.id), 5000)
      return () => clearTimeout(timer)
    })
  }, [toasts, removeToast])

  if (toasts.length === 0) return null

  return (
    <div className="toast-container" style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast toast-${toast.type}`}
          onClick={() => removeToast(toast.id)}
          style={{ cursor: 'pointer' }}
        >
          {toast.message}
        </div>
      ))}
    </div>
  )
}