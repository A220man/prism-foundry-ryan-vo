import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MarketDataPage } from '../pages/MarketData'
import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import type { MarketDataListResponse } from '../api/client'

const { mockList, mockGetSymbols, mockCreate } = vi.hoisted(() => ({
  mockList: vi.fn<(params?: { symbol?: string; start_date?: string; end_date?: string; page?: number; page_size?: number }) => Promise<AxiosResponse<MarketDataListResponse>>>(),
  mockGetSymbols: vi.fn<() => Promise<AxiosResponse<string[]>>>(),
  mockCreate: vi.fn(),
}))

vi.mock('../api/client', () => ({
  marketDataApi: {
    list: mockList,
    getSymbols: mockGetSymbols,
    create: mockCreate,
  },
  useAppStore: () => ({
    addToast: vi.fn(),
  }),
}))


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
    mockList.mockResolvedValue(makeResponse({ items: [], total: 0, page: 1, page_size: 50, total_pages: 0 }))
    mockGetSymbols.mockResolvedValue(makeResponse([]))

    render(<MarketDataPage />)

    await waitFor(() => {
      expect(screen.getByText('Market Data')).toBeInTheDocument()
    })
  })

  it('shows empty state when no data', async () => {
    mockList.mockResolvedValue(makeResponse({ items: [], total: 0, page: 1, page_size: 50, total_pages: 0 }))
    mockGetSymbols.mockResolvedValue(makeResponse([]))

    render(<MarketDataPage />)

    await waitFor(() => {
      expect(screen.getByText('No market data found. Add your first data point.')).toBeInTheDocument()
    })
  })

  it('opens modal when add button clicked', async () => {
    mockList.mockResolvedValue(makeResponse({ items: [], total: 0, page: 1, page_size: 50, total_pages: 0 }))
    mockGetSymbols.mockResolvedValue(makeResponse([]))

    render(<MarketDataPage />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add data point/i })).toBeInTheDocument()
    })
  })
})
