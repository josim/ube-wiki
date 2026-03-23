import { useQuery } from '@tanstack/react-query'
import {
  getMultisigStorage,
  getMultisigProposals,
  getAllMultisigVotes,
} from '@/lib/multisig/data'
import { MultisigVote } from '@/lib/multisig/types'
import { STALE } from './constants'

export function useMultisigStorage() {
  return useQuery({
    queryKey: ['multisig', 'storage'],
    queryFn: getMultisigStorage,
    staleTime: STALE.STORAGE,
  })
}

export function useMultisigProposals() {
  return useQuery({
    queryKey: ['multisig', 'proposals'],
    queryFn: getMultisigProposals,
    staleTime: STALE.PROPOSALS,
  })
}

export function useAllMultisigVotes() {
  return useQuery<Map<number, MultisigVote[]>>({
    queryKey: ['multisig', 'all-votes'],
    queryFn: getAllMultisigVotes,
    staleTime: STALE.VOTES,
  })
}
