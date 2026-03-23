import { useTransactionStore } from '@/lib/store/transactionStore'

/**
 * Wraps an async contract call with the global transaction modal.
 * Shows pending → success (with opHash) or error states automatically.
 *
 * @param message - Display message while transaction is pending
 * @param fn - Async function that returns an opHash string
 * @param onSuccess - Optional callback after success (e.g. invalidate queries)
 */
export async function withTransaction(
  message: string,
  fn: () => Promise<string | void>,
  onSuccess?: () => void
): Promise<string | null> {
  const { startTransaction, completeTransaction, failTransaction } =
    useTransactionStore.getState()

  startTransaction(message)

  try {
    const result = await fn()
    const opHash = result || ''
    completeTransaction(opHash)
    onSuccess?.()
    return opHash || null
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : 'Transaction failed'
    failTransaction(errorMessage)
    return null
  }
}
