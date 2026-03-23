'use client'

import { useState } from 'react'
import MDEditor from '@uiw/react-md-editor'
import rehypeSanitize from 'rehype-sanitize'
import { useThemeStore } from '@/lib/store/themeStore'

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  height?: number
}

export function MarkdownEditor({ value, onChange, height = 400 }: MarkdownEditorProps) {
  const [tab, setTab] = useState<'write' | 'preview'>('write')
  const theme = useThemeStore((s) => s.theme)

  return (
    <div className="wiki-md-editor">
      <div className="flex border-b border-border-secondary mb-0">
        <button
          onClick={() => setTab('write')}
          className={`text-xs px-3 py-1.5 -mb-px border-b-2 transition-colors ${
            tab === 'write'
              ? 'border-accent text-accent font-medium'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          Write
        </button>
        <button
          onClick={() => setTab('preview')}
          className={`text-xs px-3 py-1.5 -mb-px border-b-2 transition-colors ${
            tab === 'preview'
              ? 'border-accent text-accent font-medium'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          Preview
        </button>
      </div>

      {tab === 'write' ? (
        <div data-color-mode={theme}>
          <MDEditor
            value={value}
            onChange={(v) => onChange(v || '')}
            height={height}
            preview="edit"
            hideToolbar={false}
            visibleDragbar={false}
          />
        </div>
      ) : (
        <div
          className="border border-border-secondary rounded-b-md p-4 bg-bg-primary overflow-y-auto wiki-md"
          style={{ minHeight: height }}
        >
          <div data-color-mode={theme}>
            <MDEditor.Markdown source={value} rehypePlugins={[[rehypeSanitize]]} />
          </div>
        </div>
      )}

      <style jsx global>{`
        .wiki-md-editor .w-md-editor {
          border: 1px solid var(--color-border-secondary) !important;
          border-radius: 0 0 var(--border-radius-md) var(--border-radius-md) !important;
          box-shadow: none !important;
          background: var(--color-background-primary) !important;
          color: var(--color-text-primary) !important;
        }
        .wiki-md-editor .w-md-editor-toolbar {
          background: var(--color-background-secondary) !important;
          border-bottom: 1px solid var(--color-border-secondary) !important;
        }
        .wiki-md-editor .w-md-editor-toolbar li > button {
          color: var(--color-text-secondary) !important;
        }
        .wiki-md-editor .w-md-editor-toolbar li > button:hover {
          color: var(--color-text-primary) !important;
        }
        .wiki-md-editor .w-md-editor-text {
          font-family: var(--font-mono) !important;
        }
        .wiki-md-editor .wmde-markdown {
          font-family: var(--font-sans) !important;
          font-size: 13px !important;
          color: var(--color-text-primary) !important;
          background: transparent !important;
        }
      `}</style>
    </div>
  )
}
