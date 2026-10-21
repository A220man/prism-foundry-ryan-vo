import '@testing-library/jest-dom'
import { vi } from 'vitest'
import React from 'react'

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => React.createElement('a', { href: to }, children),
  Outlet: () => React.createElement('div', { 'data-testid': 'outlet' }),
  BrowserRouter: ({ children }: { children: React.ReactNode }) => React.createElement('div', {}, children),
  Routes: ({ children }: { children: React.ReactNode }) => React.createElement('div', {}, children),
  Route: () => null,
}))