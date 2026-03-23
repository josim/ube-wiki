'use client'

import { useParams } from 'next/navigation'
import { usePage } from '@/lib/hooks/queries'
import { WikiPage } from '@/components/wiki/WikiPage'

export default function WikiSlugClient() {
  const params = useParams()
  const slug = params.slug as string
  const { data: page, isLoading } = usePage(slug)

  if (isLoading) {
    return (
      <div className="p-[22px] text-[13px] text-text-tertiary">Loading…</div>
    )
  }

  if (!page) {
    return (
      <div className="p-[22px] text-[13px] text-text-tertiary">
        Page not found.
      </div>
    )
  }

  return <WikiPage page={page} />
}
