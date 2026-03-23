'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { WikiProposal } from '@/lib/wiki/types'
import { getPage, getPageContent, getProposalContent, approveProposal, rejectProposal } from '@/lib/wiki/data'
import { useProposals, useWikiDocument } from '@/lib/hooks/queries'
import { useTezos } from '@/lib/hooks/useTezos'
import { withTransaction } from '@/lib/utils/withTransaction'
import { DiffView } from './DiffView'
import { canEditPages } from '@/lib/store/walletStore'

function truncateAddress(addr: string) {
  return addr.length > 15 ? `${addr.slice(0, 7)}…${addr.slice(-4)}` : addr
}

const statusBadge: Record<number, { className: string; label: string }> = {
  0: { className: 'bg-warning-bg text-warning-text', label: 'pending' },
  1: { className: 'bg-success-bg text-success-text', label: 'approved' },
  2: { className: 'bg-danger-bg text-danger-text', label: 'rejected' },
}

function ProposalTitle({ cid }: { cid: string }) {
  const { data: doc } = useWikiDocument(cid)
  return <>{doc?.summary || doc?.title || 'Untitled'}</>
}

export function ProposalsPage() {
  const [showOpen, setShowOpen] = useState(true)
  const [previewId, setPreviewId] = useState<number | null>(null)
  const [diffData, setDiffData] = useState<{
    oldContent: string
    newContent: string
    title: string
  } | null>(null)
  const { role } = useTezos()
  const queryClient = useQueryClient()

  const { data: allProposals = [] } = useProposals()

  const proposals = showOpen
    ? allProposals.filter((p) => p.status === 0)
    : allProposals.filter((p) => p.status === 1 || p.status === 2)

  const invalidateProposals = () => {
    queryClient.invalidateQueries({ queryKey: ['wiki', 'proposals'] })
  }

  const handleApprove = (id: number) => {
    withTransaction('Approving proposal...', () => approveProposal(id), () => {
      invalidateProposals()
      setPreviewId(null)
      setDiffData(null)
    })
  }

  const handleReject = (id: number) => {
    withTransaction('Rejecting proposal...', () => rejectProposal(id), () => {
      invalidateProposals()
      setPreviewId(null)
      setDiffData(null)
    })
  }

  const handlePreviewDiff = async (proposal: WikiProposal) => {
    const page = await queryClient.fetchQuery({
      queryKey: ['wiki', 'page', proposal.page_slug],
      queryFn: () => getPage(proposal.page_slug),
      staleTime: 30_000,
    })
    if (!page) return
    const [currentContent, proposedContent] = await Promise.all([
      queryClient.fetchQuery({
        queryKey: ['wiki', 'content', page.current_cid],
        queryFn: () => getPageContent(page.current_cid),
        staleTime: Infinity,
      }),
      queryClient.fetchQuery({
        queryKey: ['wiki', 'proposal-content', proposal.proposed_cid],
        queryFn: () => getProposalContent(proposal.proposed_cid),
        staleTime: Infinity,
      }),
    ])
    setDiffData({
      oldContent: currentContent,
      newContent: proposedContent,
      title: proposal.page_slug,
    })
    setPreviewId(proposal.id)
  }

  return (
    <>
      <div className="px-[22px] pt-[18px] border-b border-border-tertiary flex-shrink-0 bg-bg-primary">
        <h1 className="text-[17px] font-medium text-text-primary mb-3.5">
          All Proposals
        </h1>
        <div className="flex">
          <button
            onClick={() => { setShowOpen(true); setPreviewId(null) }}
            className={`px-4 py-2 text-[13px] border-b-2 -mb-px transition-colors ${
              showOpen
                ? 'text-accent border-accent font-medium'
                : 'text-text-secondary border-transparent hover:text-text-primary'
            }`}
          >
            Open
          </button>
          <button
            onClick={() => { setShowOpen(false); setPreviewId(null) }}
            className={`px-4 py-2 text-[13px] border-b-2 -mb-px transition-colors ${
              !showOpen
                ? 'text-accent border-accent font-medium'
                : 'text-text-secondary border-transparent hover:text-text-primary'
            }`}
          >
            Closed
          </button>
        </div>
      </div>

      <div className="p-[22px] overflow-y-auto">
        {previewId !== null && diffData ? (
          <div>
            <div className="flex items-center gap-2.5 mb-3.5">
              <button
                onClick={() => setPreviewId(null)}
                className="text-xs px-2.5 py-1 rounded-md border border-border-secondary text-text-secondary hover:bg-bg-secondary hover:text-text-primary"
              >
                ← Back
              </button>
              <span className="text-[13px] text-text-secondary">
                {diffData.title}
              </span>
              {canEditPages(role) && (
                <button
                  onClick={() => handleApprove(previewId)}
                  className="text-xs px-3.5 py-1.5 rounded-md bg-accent text-white hover:bg-accent-hover"
                >
                  Approve & apply
                </button>
              )}
            </div>
            <DiffView
              oldContent={diffData.oldContent}
              newContent={diffData.newContent}
              oldLabel="Current"
              newLabel="Proposed changes"
            />
          </div>
        ) : proposals.length === 0 ? (
          <div className="text-text-tertiary text-[13px] py-5">
            No {showOpen ? 'open' : 'closed'} proposals.
          </div>
        ) : (
          proposals.map((p) => (
            <div
              key={p.id}
              className="border border-border-tertiary rounded-lg px-4 py-3.5 mb-2.5"
            >
              <div className="flex items-start justify-between gap-2.5 mb-1.5">
                <span className="font-medium text-[13px] text-text-primary">
                  <ProposalTitle cid={p.proposed_cid} />
                </span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium flex-shrink-0 ${
                    statusBadge[p.status]?.className ?? ''
                  }`}
                >
                  {statusBadge[p.status]?.label ?? ''}
                </span>
              </div>
              <div className="text-[11px] text-text-tertiary mb-1.5">
                Page:{' '}
                <strong className="text-text-secondary font-medium">
                  {p.page_slug}
                </strong>{' '}
                ·{' '}
                <span className="font-mono">
                  {truncateAddress(p.proposer)}
                </span>{' '}
                · {p.created_at}
              </div>
              {p.status === 0 && canEditPages(role) && (
                <div className="flex gap-1.5 mt-2.5">
                  <button
                    onClick={() => handleApprove(p.id)}
                    className="text-xs px-3.5 py-1.5 rounded-md bg-accent text-white hover:bg-accent-hover"
                  >
                    Approve & apply
                  </button>
                  <button
                    onClick={() => handleReject(p.id)}
                    className="text-xs px-2.5 py-1 rounded-md border border-border-secondary text-text-secondary hover:bg-bg-secondary hover:text-text-primary"
                  >
                    Reject
                  </button>
                  {p.proposed_cid && (
                    <button
                      onClick={() => handlePreviewDiff(p)}
                      className="text-xs px-2.5 py-1 rounded-md border border-border-secondary text-text-secondary hover:bg-bg-secondary hover:text-text-primary"
                    >
                      Preview diff
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </>
  )
}
