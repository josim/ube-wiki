'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createPage } from '@/lib/wiki/data'
import { titleToSlug } from '@/lib/wiki/types'
import { useTezos } from '@/lib/hooks/useTezos'
import { canEditPages } from '@/lib/store/walletStore'
import { withTransaction } from '@/lib/utils/withTransaction'
import { MarkdownEditor } from './MarkdownEditor'

export function CreatePageForm() {
  const { address, role } = useTezos()
  const router = useRouter()

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [summary, setSummary] = useState('')

  const slug = titleToSlug(title)

  if (!address) {
    return (
      <div className="p-[22px]">
        <div className="bg-warning-bg text-warning-text px-3.5 py-2.5 rounded-md text-[13px] leading-relaxed">
          Connect your wallet to create pages.
        </div>
      </div>
    )
  }

  if (!canEditPages(role)) {
    return (
      <div className="p-[22px]">
        <div className="bg-warning-bg text-warning-text px-3.5 py-2.5 rounded-md text-[13px] leading-relaxed">
          Only moderators can create new pages.
        </div>
      </div>
    )
  }

  const handleCreate = () => {
    if (!slug || !content.trim()) return
    withTransaction(
      'Creating page...',
      () => createPage(title, slug, content, summary || 'Initial draft'),
      () => router.push(`/wiki/${slug}`)
    )
  }

  return (
    <div className="p-[22px]">

      <label className="block text-[11px] text-text-tertiary uppercase tracking-[0.08em] font-medium mb-1">
        Page title
      </label>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="e.g. Getting Started"
        className="w-full py-1.5 px-3 border border-border-secondary rounded-md bg-bg-secondary text-text-primary text-[13px] mb-1 focus:outline-none focus:border-accent"
      />
      {slug && (
        <p className="text-[11px] text-text-tertiary mb-3 font-mono">
          slug: {slug}
        </p>
      )}

      <label className="block text-[11px] text-text-tertiary uppercase tracking-[0.08em] font-medium mb-1 mt-2">
        Content (Markdown)
      </label>
      <MarkdownEditor value={content} onChange={setContent} height={350} />

      <label className="block text-[11px] text-text-tertiary uppercase tracking-[0.08em] font-medium mb-1 mt-3">
        Summary
      </label>
      <input
        type="text"
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
        placeholder="Initial draft"
        className="w-full py-1.5 px-3 border border-border-secondary rounded-md bg-bg-secondary text-text-primary text-[13px] mb-3 focus:outline-none focus:border-accent"
      />

      <div className="flex gap-2">
        <button
          onClick={handleCreate}
          disabled={!slug || !content.trim()}
          className="text-xs px-3.5 py-1.5 rounded-md bg-accent text-white hover:bg-accent-hover disabled:opacity-50"
        >
          Create page
        </button>
        <button
          onClick={() => router.push('/wiki')}
          className="text-xs px-3.5 py-1 rounded-md border border-border-secondary text-text-secondary hover:bg-bg-secondary hover:text-text-primary"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
