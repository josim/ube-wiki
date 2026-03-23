import { useQuery } from '@tanstack/react-query'
import {
  getPageList,
  getPage,
  getPageContent,
  getWikiDocument,
  getProposals,
  getProposal,
  getProposalContent,
} from '@/lib/wiki/data'
import { ProposalStatus } from '@/lib/wiki/types'
import { STALE } from './constants'

export function usePageList() {
  return useQuery({
    queryKey: ['wiki', 'pages'],
    queryFn: getPageList,
    staleTime: STALE.PAGES,
  })
}

export function usePage(slug: string) {
  return useQuery({
    queryKey: ['wiki', 'page', slug],
    queryFn: () => getPage(slug),
    enabled: !!slug,
    staleTime: STALE.PAGE,
  })
}

export function usePageContent(cid: string) {
  return useQuery({
    queryKey: ['wiki', 'content', cid],
    queryFn: () => getPageContent(cid),
    enabled: !!cid,
    staleTime: STALE.IPFS,
  })
}

export function useWikiDocument(cid: string) {
  return useQuery({
    queryKey: ['wiki', 'document', cid],
    queryFn: () => getWikiDocument(cid),
    enabled: !!cid,
    staleTime: STALE.IPFS,
  })
}

export function useProposals(status?: ProposalStatus) {
  return useQuery({
    queryKey: ['wiki', 'proposals', status ?? 'all'],
    queryFn: () => getProposals(status),
    staleTime: STALE.PROPOSALS,
  })
}

export function useProposal(id: number) {
  return useQuery({
    queryKey: ['wiki', 'proposal', id],
    queryFn: () => getProposal(id),
    enabled: id >= 0,
    staleTime: STALE.PROPOSALS,
  })
}

export function useProposalContent(cid: string) {
  return useQuery({
    queryKey: ['wiki', 'proposal-content', cid],
    queryFn: () => getProposalContent(cid),
    enabled: !!cid,
    staleTime: STALE.IPFS,
  })
}

export function usePendingProposalCount() {
  const { data: proposals } = useProposals()
  return { data: proposals?.filter((p) => p.status === 0).length ?? 0 }
}
