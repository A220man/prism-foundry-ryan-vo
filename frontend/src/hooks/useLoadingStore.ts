import { create } from 'zustand'

interface LoadingState {
  globalLoading: number
  startLoading: () => void
  stopLoading: () => void
}

export const useLoadingStore = create<LoadingState>((set) => ({
  globalLoading: 0,
  startLoading: () => set((state) => ({ globalLoading: state.globalLoading + 1 })),
  stopLoading: () => set((state) => ({ globalLoading: Math.max(0, state.globalLoading - 1) })),
}))