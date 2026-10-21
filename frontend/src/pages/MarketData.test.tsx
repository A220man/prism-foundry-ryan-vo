import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MarketDataPage } from '../pages/MarketData'
import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import type { MarketDataListResponse } from '../api/client'

vi.mock('../api/client', () => {
  const mockList = vi.fn<(params?: { symbol?: string; start_date?: string; end_date?: string; page?: number; page_size?: number }) => Promise<AxiosResponse<MarketDataListResponse>>>()
  const mockGetSymbols = vi.fn<() => Promise<AxiosResponse<string[]>>>()
  return {
    marketDataApi: {
      list: mockList,
      getSymbols: mockGetSymbols,
      create: vi.fn(),
    },
    useAppStore: () => ({
      addToast: vi.fn(),
    }),
  }
})

import { marketDataApi } from '../api/client'

function makeResponse<T>(data: T): AxiosResponse<T> {
  return {
    data,
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {} as InternalAxiosRequestConfig,
  }
}

describe('MarketDataPage', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('renders market data title', async () => {
    marketDataApi.list.mockResolvedValue(makeResponse({ items: [], total: 0, page: 1, page_size: 50, total_pages: 0 }))
    marketDataApi.getSymbols.mockResolvedValue(makeResponse([]))

    render(<MarketDataPage />)

    await waitFor(() => {
      expect(screen.getByText('Market Data')).toBeInTheDocument()
    })
  })

  it('shows empty state when no data', async () => {
    marketDataApi.list.mockResolvedValue(makeResponse({ items: [], total: 0, page: 1, page_size: 50, total_pages: 0 }))
    marketDataApi.getSymbols.mockResolvedValue(makeResponse([]))

    render(<MarketDataPage />)

    await waitFor(() => {
      expect(screen.getByText('No market data found. Add your first data point.')).toBeInTheDocument()
    })
  })

  it('opens modal when add button clicked', async () => {
    marketDataApi.list.mockResolvedValue(makeResponse({ items: [], total: 0, page: 1, page_size: 50, total_pages: 0 }))
    marketDataApi.getSymbols.mockResolvedValue(makeResponse([]))

    render(<MarketDataPage />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add data point/i })).toBeInTheDocument()
    })
  })
})