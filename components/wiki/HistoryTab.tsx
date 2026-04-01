'use client'

import { useState } from 'react'
import { WikiPage } from '@/lib/wiki/types'
import { getPageContent, updatePage } from '@/lib/wiki/data'
import { usePageContent } from '@/lib/hooks/queries'
import { MarkdownRenderer } from './MarkdownRenderer'
import { DiffView } from './DiffView'
import { useTezos } from '@/lib/hooks/useTezos'
import { canEditPages } from '@/lib/store/walletStore'
import { withTransaction } from '@/lib/utils/withTransaction'
import { truncateAddress } from '@/lib/utils'

type View = 'list' | 'version' | 'diff'

export function HistoryTab({
  page,
  onRevert,
}: {
  page: WikiPage
  onRevert: () => void
}) {
  const { role, address } = useTezos()

  const [view, setView] = useState<View>('list')
  const [viewVersion, setViewVersion] = useState<number | null>(null)
  const [diffA, setDiffA] = useState<number | null>(null)
  const [diffB, setDiffB] = useState<number | null>(null)

  const versions = [...page.versions].reverse()
  const canCompare = diffA !== null && diffB !== null && diffA !== diffB

  // Resolve CIDs for selected versions
  const viewCid = view === 'version' && viewVersion !== null
    ? page.versions.find((v) => v.version === viewVersion)?.cid ?? ''
    : ''
  const diffACid = view === 'diff' && diffA !== null
    ? page.versions.find((v) => v.version === diffA)?.cid ?? ''
    : ''
  const diffBCid = view === 'diff' && diffB !== null
    ? page.versions.find((v) => v.version === diffB)?.cid ?? ''
    : ''

  const { data: versionContent = '' } = usePageContent(viewCid)
  const { data: diffAContent = '' } = usePageContent(diffACid)
  const { data: diffBContent = '' } = usePageContent(diffBCid)

  const handleRevert = (versionNum: number) => {
    const v = page.versions.find((ver) => ver.version === versionNum)
    if (!v || !address) return
    withTransaction(
      `Reverting to v${versionNum}...`,
      async () => {
        const content = await getPageContent(v.cid)
        return updatePage(page.slug, page.title, content, `Reverted to v${versionNum}`)
      },
      onRevert
    )
  }

  if (view === 'version' && viewVersion !== null) {
    const v = page.versions.find((ver) => ver.version === viewVersion)
    if (!v) return null
    return (
      <div className="p-[22px] overflow-y-auto">
        <div className="flex items-center gap-2.5 mb-3.5">
          <button
            onClick={() => setView('list')}
            className="text-xs px-2.5 py-1 rounded-md border border-border-secondary text-text-secondary hover:bg-bg-secondary hover:text-text-primary"
          >
            ← Back to history
          </button>
          <span className="text-[13px] text-text-secondary">
            Viewing v{v.version}
          </span>
          {canEditPages(role) && (
            <button
              onClick={() => handleRevert(v.version)}
              className="text-xs px-3.5 py-1.5 rounded-md bg-accent text-white hover:bg-accent-hover"
            >
              Revert to this version
            </button>
          )}
        </div>
        <div className="bg-info-bg text-info-text px-3.5 py-2.5 rounded-md text-[13px] mb-3.5 leading-relaxed">
          This is an older version —{' '}
          <button
            onClick={onRevert}
            className="font-medium underline"
          >
            view current
          </button>
        </div>
        <MarkdownRenderer content={versionContent} />
      </div>
    )
  }

  if (view === 'diff' && diffA !== null && diffB !== null) {
    const vA = page.versions.find((v) => v.version === diffA)
    const vB = page.versions.find((v) => v.version === diffB)
    if (!vA || !vB) return null
    return (
      <div className="p-[22px] overflow-y-auto">
        <div className="flex items-center gap-2.5 mb-3.5">
          <button
            onClick={() => setView('list')}
            className="text-xs px-2.5 py-1 rounded-md border border-border-secondary text-text-secondary hover:bg-bg-secondary hover:text-text-primary"
          >
            ← Back to history
          </button>
          <span className="text-[13px] text-text-secondary">
            Comparing v{diffA} → v{diffB}
          </span>
        </div>
        <DiffView
          oldContent={diffAContent}
          newContent={diffBContent}
          oldLabel={`v${diffA} — ${vA.timestamp}`}
          newLabel={`v${diffB} — ${vB.timestamp}`}
        />
      </div>
    )
  }

  // List view
  return (
    <div className="p-[22px] overflow-y-auto">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-text-tertiary">
          Click A and B on two versions, then compare
        </span>
        {canCompare && (
          <button
            onClick={() => setView('diff')}
            className="text-xs px-3.5 py-1.5 rounded-md bg-accent text-white hover:bg-accent-hover"
          >
            Compare
          </button>
        )}
      </div>
      {versions.map((v) => (
        <div
          key={v.version}
          className="flex items-center gap-2 py-2.5 border-b border-border-tertiary"
        >
          <span className="font-mono text-[11px] bg-bg-secondary text-text-secondary px-1.5 py-0.5 rounded-md flex-shrink-0">
            v{v.version}
          </span>
          <span className="font-mono text-[11px] text-text-tertiary flex-shrink-0 flex-1">
            {truncateAddress(v.editor)}
          </span>
          <span className="text-[11px] text-text-tertiary flex-shrink-0">
            {v.timestamp}
          </span>
          <div className="flex gap-1 flex-shrink-0">
            <button
              onClick={() => {
                setViewVersion(v.version)
                setView('version')
              }}
              className="text-xs px-2.5 py-1 rounded-md border border-border-secondary text-text-secondary hover:bg-bg-secondary hover:text-text-primary"
            >
              View
            </button>
            <button
              onClick={() => setDiffA(v.version)}
              className={`text-xs px-2.5 py-1 rounded-md border text-text-secondary ${
                diffA === v.version
                  ? 'bg-info-bg text-info-text border-transparent'
                  : 'border-border-secondary hover:bg-bg-secondary hover:text-text-primary'
              }`}
            >
              A
            </button>
            <button
              onClick={() => setDiffB(v.version)}
              className={`text-xs px-2.5 py-1 rounded-md border text-text-secondary ${
                diffB === v.version
                  ? 'bg-info-bg text-info-text border-transparent'
                  : 'border-border-secondary hover:bg-bg-secondary hover:text-text-primary'
              }`}
            >
              B
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
