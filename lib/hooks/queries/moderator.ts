import { useQuery } from '@tanstack/react-query'
import {
  getModeratorStorage,
  getModeratorProposals,
  getAllModeratorVotes,
} from '@/lib/moderator/data'
import { ModeratorVote } from '@/lib/moderator/types'
import { STALE } from './constants'

export function useModeratorStorage() {
  return useQuery({
    queryKey: ['moderator', 'storage'],
    queryFn: getModeratorStorage,
    staleTime: STALE.STORAGE,
  })
}

export function useModeratorProposals() {
  return useQuery({
    queryKey: ['moderator', 'proposals'],
    queryFn: getModeratorProposals,
    staleTime: STALE.PROPOSALS,
  })
}

export function useAllModeratorVotes() {
  return useQuery<Map<number, ModeratorVote[]>>({
    queryKey: ['moderator', 'all-votes'],
    queryFn: getAllModeratorVotes,
    staleTime: STALE.VOTES,
  })
}
