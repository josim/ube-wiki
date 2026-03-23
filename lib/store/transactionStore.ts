import { create } from 'zustand'

type TxStatus = 'idle' | 'pending' | 'success' | 'error'

interface TransactionState {
  status: TxStatus
  message: string
  opHash: string | null
  error: string | null
  startTransaction: (message: string) => void
  completeTransaction: (opHash: string) => void
  failTransaction: (error: string) => void
  reset: () => void
}

export const useTransactionStore = create<TransactionState>((set) => ({
  status: 'idle',
  message: '',
  opHash: null,
  error: null,

  startTransaction: (message: string) =>
    set({ status: 'pending', message, opHash: null, error: null }),

  completeTransaction: (opHash: string) =>
    set({ status: 'success', opHash, error: null }),

  failTransaction: (error: string) =>
    set({ status: 'error', error }),

  reset: () =>
    set({ status: 'idle', message: '', opHash: null, error: null }),
}))
