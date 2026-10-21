import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'

declare global {
  interface ImportMetaEnv {
    readonly VITE_API_BASE: string
  }
  interface ImportMeta {
    readonly env: ImportMetaEnv
  }
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
})

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Types
export interface MarketData {
  id: number
  symbol: string
  timestamp: string
  open: number
  high: number
  low: number
  close: number
  volume: number
  source: string
  created_at: string
}

export interface MarketDataListResponse {
  items: MarketData[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface MarketDataCreate {
  symbol: string
  timestamp: string
  open: number
  high: number
  low: number
  close: number
  volume: number
  source?: string
}

export interface Prediction {
  id: number
  symbol: string
  context_start: string
  context_end: string
  prediction_start: string
  prediction_end: string
  predicted_values: number[]
  actual_values: number[] | null
  mae: number | null
  rmse: number | null
  mape: number | null
  correlation: number | null
  model_version: string
  created_at: string
}

export interface PredictionListResponse {
  items: Prediction[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface PredictionCreate {
  symbol: string
  context_start: string
  context_end: string
  prediction_start: string
  prediction_end: string
  predicted_values: number[]
  actual_values?: number[]
  model_version: string
}

export interface EvaluationResult {
  mae: number | null
  rmse: number | null
  mape: number | null
  correlation: number | null
}

export interface FineTuneRun {
  id: number
  name: string
  symbol: string
  base_model: string
  status: string
  epochs: number
  learning_rate: number
  train_loss: number | null
  val_loss: number | null
  config: Record<string, unknown>
  artifacts_path: string | null
  error_message: string | null
  started_at: string | null
  completed_at: string | null
  created_at: string
}

export interface FineTuneRunListResponse {
  items: FineTuneRun[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface FineTuneRunCreate {
  name: string
  symbol: string
  base_model: string
  epochs?: number
  learning_rate?: number
  config?: Record<string, unknown>
}

export interface FineTuneRunUpdate {
  status?: string
  train_loss?: number
  val_loss?: number
  config?: Record<string, unknown>
  artifacts_path?: string
  error_message?: string
  completed_at?: string
}

// Market Data API
export const marketDataApi = {
  list: (params?: { symbol?: string; start_date?: string; end_date?: string; page?: number; page_size?: number }) =>
    api.get<MarketDataListResponse>('', { params }),
  getSymbols: () => api.get<string[]>('/symbols'),
  create: (data: MarketDataCreate) => api.post<MarketData>('', data),
  get: (id: number) => api.get<MarketData>(`/${id}`),
}

// Predictions API
export const predictionsApi = {
  list: (params?: { symbol?: string; page?: number; page_size?: number }) =>
    api.get<PredictionListResponse>('/predictions', { params }),
  create: (data: PredictionCreate) => api.post<Prediction>('/predictions', data),
  get: (id: number) => api.get<Prediction>(`/predictions/${id}`),
  evaluate: (predicted: number[], actual: number[]) =>
    api.post<EvaluationResult>('/predictions/evaluate', { predicted, actual }),
}

// Fine-tune API
export const finetuneApi = {
  list: (params?: { symbol?: string; status?: string; page?: number; page_size?: number }) =>
    api.get<FineTuneRunListResponse>('/finetune', { params }),
  create: (data: FineTuneRunCreate) => api.post<FineTuneRun>('/finetune', data),
  get: (id: number) => api.get<FineTuneRun>(`/finetune/${id}`),
  update: (id: number, data: FineTuneRunUpdate) => api.patch<FineTuneRun>(`/finetune/${id}`, data),
}

// Health API
export const healthApi = {
  check: () => api.get<{ status: string; app: string; version: string; environment: string }>('/health'),
  dbCheck: () => api.get<{ status: string; database: string; error?: string }>('/health/db'),
}

// Auth API
export const authApi = {
  login: () => api.get<{ auth_url: string; state: string }>('/auth/login'),
  callback: (code: string, state: string) =>
    api.get<{ access_token: string; token_type: string; expires_in: number; refresh_token?: string; id_token?: string }>(
      '/auth/callback',
      { params: { code, state } }
    ),
  logout: () => api.post('/auth/logout'),
  me: () => api.get<{ sub: string; email?: string; name?: string; preferred_username?: string; realm_access?: Record<string, string[]> }>('/auth/me'),
}