import { useQuery } from '@tanstack/react-query'
import {
  getOverviewStats,
  getPollStats,
  getTokenStats,
} from '@/lib/api/commentsStats'
import { fetchTokensMetadata } from '@/lib/api/tzkt-mainnet'

const FIVE_MINUTES = 5 * 60 * 1000

export function useOverviewStats() {
  return useQuery({
    queryKey: ['stats', 'overview'],
    queryFn: getOverviewStats,
    staleTime: FIVE_MINUTES,
  })
}

export function usePollStats() {
  return useQuery({
    queryKey: ['stats', 'poll'],
    queryFn: getPollStats,
    staleTime: FIVE_MINUTES,
  })
}

export function useTokenStats() {
  return useQuery({
    queryKey: ['stats', 'token'],
    queryFn: getTokenStats,
    staleTime: FIVE_MINUTES,
  })
}

export function useTokensMetadata(
  pairs: { fa2_address: string; token_id: string }[]
) {
  // Sort for stable cache key.
  const sorted = [...pairs].sort((a, b) =>
    `${a.fa2_address}:${a.token_id}`.localeCompare(`${b.fa2_address}:${b.token_id}`)
  )
  return useQuery({
    queryKey: ['stats', 'tokens-metadata', sorted],
    queryFn: () => fetchTokensMetadata(sorted),
    enabled: sorted.length > 0,
    staleTime: Infinity,
  })
}
