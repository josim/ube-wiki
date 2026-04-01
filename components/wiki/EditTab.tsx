'use client'

import { useState } from 'react'
import { WikiPage } from '@/lib/wiki/types'
import { updatePage, createProposal } from '@/lib/wiki/data'
import { usePageContent, useWikiDocument } from '@/lib/hooks/queries'
import { useTezos } from '@/lib/hooks/useTezos'
import { canEditPages } from '@/lib/store/walletStore'
import { withTransaction } from '@/lib/utils/withTransaction'
import { MarkdownEditor } from './MarkdownEditor'

export function EditTab({
  page,
  onSave,
}: {
  page: WikiPage
  onSave: () => void
}) {
  const { address, role } = useTezos()
  const { data: loadedContent, isLoading, isError } = usePageContent(page.current_cid)
  const { data: doc } = useWikiDocument(page.current_cid)
  const [title, setTitle] = useState<string | null>(null)
  const [content, setContent] = useState<string | null>(null)
  const [summary, setSummary] = useState('')

  // Initialize from IPFS doc, but let user edits take precedence
  const editorTitle = title ?? doc?.title ?? page.title
  const editorContent = content ?? loadedContent ?? ''

  if (!address) {
    return (
      <div className="p-[22px]">
        <div className="bg-warning-bg text-warning-text px-3.5 py-2.5 rounded-md text-[13px] leading-relaxed">
          Connect your wallet to contribute to this wiki.
        </div>
      </div>
    )
  }

  if (role === 'visitor') {
    return (
      <div className="p-[22px]">
        <div className="bg-warning-bg text-warning-text px-3.5 py-2.5 rounded-md text-[13px] leading-relaxed">
          You need Teia tokens to submit proposals. Token holders can suggest
          changes that moderators review on-chain.
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="p-[22px] text-text-tertiary text-[13px]">Loading content...</div>
    )
  }

  if (isError) {
    return (
      <div className="p-[22px]">
        <div className="bg-danger-bg text-danger-text px-3.5 py-2.5 rounded-md text-[13px] leading-relaxed">
          Failed to load page content. Please try again later.
        </div>
      </div>
    )
  }

  const isModerator = canEditPages(role)

  const handleSubmit = () => {
    if (!editorTitle.trim() || !editorContent.trim() || !address) return
    const message = isModerator ? 'Saving page...' : 'Submitting proposal...'
    const fn = isModerator
      ? () => updatePage(page.slug, editorTitle, editorContent, summary || 'Updated')
      : () => createProposal(page.slug, editorTitle, editorContent, summary || 'Proposed change')
    withTransaction(message, fn, onSave)
  }

  return (
    <div className="p-[22px]">
      <label className="block text-[11px] text-text-tertiary uppercase tracking-[0.08em] font-medium mb-1">
        Title
      </label>
      <input
        type="text"
        value={editorTitle}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full py-1.5 px-3 border border-border-secondary rounded-md bg-bg-secondary text-text-primary text-[13px] mb-2.5 focus:outline-none focus:border-accent"
      />
      <MarkdownEditor value={editorContent} onChange={setContent} height={300} />
      <input
        type="text"
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
        placeholder={
          isModerator
            ? 'Edit summary (e.g. Fixed typo in FAQ)'
            : 'Proposal summary'
        }
        className="w-full py-1.5 px-3 border border-border-secondary rounded-md bg-bg-secondary text-text-primary text-[13px] my-2.5 focus:outline-none focus:border-accent"
      />
      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          className="text-xs px-3.5 py-1.5 rounded-md bg-accent text-white hover:bg-accent-hover"
        >
          {isModerator ? 'Save changes' : 'Submit proposal'}
        </button>
        <button
          onClick={onSave}
          className="text-xs px-3.5 py-1 rounded-md border border-border-secondary text-text-secondary hover:bg-bg-secondary hover:text-text-primary"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
