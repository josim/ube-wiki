'use client'

import { diffLines } from 'diff'

interface DiffViewProps {
  oldContent: string
  newContent: string
  oldLabel: string
  newLabel: string
}

export function DiffView({ oldContent, newContent, oldLabel, newLabel }: DiffViewProps) {
  const changes = diffLines(oldContent, newContent)

  // Build side-by-side rows
  const rows: { left: string; right: string; type: 'same' | 'add' | 'remove' | 'change' }[] = []

  for (const change of changes) {
    const lines = change.value.replace(/\n$/, '').split('\n')
    for (const line of lines) {
      if (change.added) {
        rows.push({ left: '', right: '+ ' + line, type: 'add' })
      } else if (change.removed) {
        rows.push({ left: '- ' + line, right: '', type: 'remove' })
      } else {
        rows.push({ left: line, right: line, type: 'same' })
      }
    }
  }

  return (
    <div className="border border-border-tertiary rounded-md overflow-hidden">
      <div className="flex border-b border-border-tertiary">
        <div className="flex-1 px-3 py-1.5 text-[11px] font-medium text-text-secondary bg-bg-secondary border-r border-border-tertiary">
          {oldLabel}
        </div>
        <div className="flex-1 px-3 py-1.5 text-[11px] font-medium text-text-secondary bg-bg-secondary">
          {newLabel}
        </div>
      </div>
      {rows.map((row, i) => (
        <div key={i} className="flex">
          <div
            className={`flex-1 px-3 py-px whitespace-pre-wrap leading-[1.6] text-xs font-mono min-w-0 break-words border-r border-border-tertiary ${
              row.type === 'remove'
                ? 'bg-danger-bg text-danger-text'
                : row.type === 'same'
                ? 'text-text-tertiary'
                : ''
            }`}
          >
            {row.left}
          </div>
          <div
            className={`flex-1 px-3 py-px whitespace-pre-wrap leading-[1.6] text-xs font-mono min-w-0 break-words ${
              row.type === 'add'
                ? 'bg-success-bg text-success-text'
                : row.type === 'same'
                ? 'text-text-tertiary'
                : ''
            }`}
          >
            {row.right}
          </div>
        </div>
      ))}
    </div>
  )
}
