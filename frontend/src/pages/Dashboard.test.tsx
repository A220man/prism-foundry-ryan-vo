import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { Dashboard } from '../pages/Dashboard'
import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios'

vi.mock('../api/client', () => {
  const mockCheck = vi.fn<() => Promise<AxiosResponse<{ status: string; app: string; version: string; environment: string }>>>()
  const mockDbCheck = vi.fn<() => Promise<AxiosResponse<{ status: string; database: string; error?: string }>>>()
  return {
    healthApi: {
      check: mockCheck,
      dbCheck: mockDbCheck,
    },
  }
})

import { healthApi } from '../api/client'

function makeResponse<T>(data: T): AxiosResponse<T> {
  return {
    data,
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {} as InternalAxiosRequestConfig,
  }
}

describe('Dashboard', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('renders dashboard title', async () => {
    healthApi.check.mockResolvedValue(makeResponse({ status: 'healthy', app: 'prism-foundry', version: '1.0.0', environment: 'development' }))
    healthApi.dbCheck.mockResolvedValue(makeResponse({ status: 'healthy', database: 'connected' }))

    render(<Dashboard />)

    await waitFor(() => {
      expect(screen.getByText('Prism Foundry Dashboard')).toBeInTheDocument()
    })
  })

  it('shows healthy status when API returns healthy', async () => {
    healthApi.check.mockResolvedValue(makeResponse({ status: 'healthy', app: 'prism-foundry', version: '1.0.0', environment: 'development' }))
    healthApi.dbCheck.mockResolvedValue(makeResponse({ status: 'healthy', database: 'connected' }))

    render(<Dashboard />)

    await waitFor(() => {
      expect(screen.getByText('Healthy')).toBeInTheDocument()
      expect(screen.getByText('Connected')).toBeInTheDocument()
    })
  })

  it('shows workflow cards', async () => {
    healthApi.check.mockResolvedValue(makeResponse({ status: 'healthy', app: 'prism-foundry', version: '1.0.0', environment: 'development' }))
    healthApi.dbCheck.mockResolvedValue(makeResponse({ status: 'healthy', database: 'connected' }))

    render(<Dashboard />)

    await waitFor(() => {
      expect(screen.getByText('Market Data Ingestion')).toBeInTheDocument()
      expect(screen.getByText('Kronos Predictions')).toBeInTheDocument()
      expect(screen.getByText('Fine-tuning Workflows')).toBeInTheDocument()
      expect(screen.getByText('Model Evaluation')).toBeInTheDocument()
    })
  })
})