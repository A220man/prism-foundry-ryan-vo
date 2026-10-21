interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const sizeMap = { sm: '1rem', md: '1.5rem', lg: '2.5rem' }
  const style = { width: sizeMap[size], height: sizeMap[size] }

  return (
    <div
      className={`loading-spinner ${className}`}
      style={style}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  )
}