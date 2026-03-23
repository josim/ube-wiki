'use client'

import { useState } from 'react'
import { WikiPage as WikiPageType } from '@/lib/wiki/types'
import { ReadTab } from './ReadTab'
import { HistoryTab } from './HistoryTab'
import { EditTab } from './EditTab'
import { useTezos } from '@/lib/hooks/useTezos'
import { canEditPages } from '@/lib/store/walletStore'

type TabId = 'read' | 'history' | 'edit'

export function WikiPage({ page }: { page: WikiPageType }) {
  const [activeTab, setActiveTab] = useState<TabId>('read')
  const { role } = useTezos()

  const editLabel = canEditPages(role) ? 'Edit' : 'Propose change'

  const tabs: { id: TabId; label: string }[] = [
    { id: 'read', label: 'Read' },
    { id: 'history', label: `History (${page.versions.length})` },
    { id: 'edit', label: editLabel },
  ]

  // Force re-render when switching back to read after an edit
  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab)
  }

  return (
    <>
      <div className="px-[22px] pt-[18px] border-b border-border-tertiary flex-shrink-0 bg-bg-primary">
        <h1 className="text-[17px] font-medium text-text-primary mb-3.5">
          {page.title}
        </h1>
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`px-4 py-2 text-[13px] border-b-2 -mb-px transition-colors ${
                activeTab === tab.id
                  ? 'text-accent border-accent font-medium'
                  : 'text-text-secondary border-transparent hover:text-text-primary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'read' && <ReadTab page={page} />}
      {activeTab === 'history' && (
        <HistoryTab page={page} onRevert={() => setActiveTab('read')} />
      )}
      {activeTab === 'edit' && (
        <EditTab page={page} onSave={() => setActiveTab('read')} />
      )}
    </>
  )
}
