'use client'

import { WikiPage } from '@/lib/wiki/types'
import { usePageContent } from '@/lib/hooks/queries'
import { MarkdownRenderer } from './MarkdownRenderer'
export function ReadTab({ page }: { page: WikiPage }) {
  const { data: content = '' } = usePageContent(page.current_cid)
  const current = page.versions[page.versions.length - 1]

  if (!current) return null

  return (
    <div className="p-[22px] overflow-y-auto">
      <MarkdownRenderer content={content} />
    </div>
  )
}
