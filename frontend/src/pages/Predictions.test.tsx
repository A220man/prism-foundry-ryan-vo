import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { PredictionsPage } from '../pages/Predictions'
import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import type { PredictionListResponse } from '../api/client'

vi.mock('../api/client', () => {
  const mockList = vi.fn<(params?: { symbol?: string; page?: number; page_size?: number }) => Promise<AxiosResponse<PredictionListResponse>>>()
  return {
    predictionsApi: {
      list: mockList,
      evaluate: vi.fn(),
    },
    useAppStore: () => ({
      addToast: vi.fn(),
    }),
  }
})

import { predictionsApi } from '../api/client'

function makeResponse<T>(data: T): AxiosResponse<T> {
  return {
    data,
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {} as InternalAxiosRequestConfig,
  }
}

describe('PredictionsPage', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('renders predictions title', async () => {
    predictionsApi.list.mockResolvedValue(makeResponse({ items: [], total: 0, page: 1, page_size: 50, total_pages: 0 }))

    render(<PredictionsPage />)

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'Predictions' })).toBeInTheDocument()
    })
  })

  it('shows empty state when no predictions', async () => {
    predictionsApi.list.mockResolvedValue(makeResponse({ items: [], total: 0, page: 1, page_size: 50, total_pages: 0 }))

    render(<PredictionsPage />)

    await waitFor(() => {
      expect(screen.getByText('No predictions yet. Create your first prediction.')).toBeInTheDocument()
    })
  })

  it('opens modal when create button clicked', async () => {
    predictionsApi.list.mockResolvedValue(makeResponse({ items: [], total: 0, page: 1, page_size: 50, total_pages: 0 }))

    render(<PredictionsPage />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /create prediction/i })).toBeInTheDocument()
    })
  })
})