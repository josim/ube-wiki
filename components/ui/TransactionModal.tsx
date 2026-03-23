'use client'

import { useTransactionStore } from '@/lib/store/transactionStore'
import { TZKT_EXPLORER } from '@/lib/constants'

export function TransactionModal() {
  const { status, message, opHash, error, reset } = useTransactionStore()

  if (status === 'idle') return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={status !== 'pending' ? reset : undefined}
      />

      {/* Modal */}
      <div className="relative bg-bg-primary border border-border-tertiary rounded-lg shadow-lg max-w-sm w-full mx-4 p-6">
        {/* Pending */}
        {status === 'pending' && (
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            <p className="text-[13px] text-text-primary font-medium">
              {message}
            </p>
            <p className="text-[11px] text-text-tertiary">
              Waiting for confirmation...
            </p>
          </div>
        )}

        {/* Success */}
        {status === 'success' && (
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="w-10 h-10 rounded-full bg-success-bg flex items-center justify-center">
              <span className="text-success-text text-lg">✓</span>
            </div>
            <p className="text-[13px] text-text-primary font-medium">
              Transaction confirmed
            </p>
            {opHash && (
              <a
                href={`${TZKT_EXPLORER}/${opHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[12px] text-accent hover:underline font-mono"
              >
                View on TzKT →
              </a>
            )}
            <button
              onClick={reset}
              className="text-xs px-4 py-1.5 rounded-md border border-border-secondary text-text-secondary hover:bg-bg-secondary hover:text-text-primary mt-1"
            >
              Close
            </button>
          </div>
        )}

        {/* Error */}
        {status === 'error' && (
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="w-10 h-10 rounded-full bg-danger-bg flex items-center justify-center">
              <span className="text-danger-text text-lg">✗</span>
            </div>
            <p className="text-[13px] text-text-primary font-medium">
              Transaction failed
            </p>
            <p className="text-[11px] text-text-tertiary max-w-[280px] break-words">
              {error}
            </p>
            <button
              onClick={reset}
              className="text-xs px-4 py-1.5 rounded-md border border-border-secondary text-text-secondary hover:bg-bg-secondary hover:text-text-primary mt-1"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
