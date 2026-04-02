'use client'

import { useState } from 'react'
import { useUserProfile } from '@/lib/hooks/queries'

export function ProfilePage({ addressOrName }: { addressOrName: string }) {
  const { data: profile, isLoading } = useUserProfile(addressOrName)
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    const addr = profile?.address || addressOrName
    navigator.clipboard.writeText(addr)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  if (isLoading) {
    return (
      <div className="p-[22px] text-[13px] text-text-tertiary">Loading…</div>
    )
  }

  const isAddress = addressOrName.startsWith('tz') || addressOrName.startsWith('KT')

  if (!profile && !isAddress) {
    return (
      <div className="p-[22px] text-[13px] text-text-tertiary">
        No user found with name <strong>{addressOrName}</strong>.
      </div>
    )
  }

  const displayAddress = profile?.address || addressOrName
  const displayName = profile?.name || ''
  const displayDomain = profile?.domain || ''
  const displayAvatar = profile?.avatar || ''
  const displayDescription = profile?.description || ''

  return (
    <div className="p-[22px]">
      <div className="max-w-lg">
        <div className="flex items-start gap-4 mb-5">
          {displayAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={displayAvatar}
              alt=""
              className="w-16 h-16 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-bg-secondary border border-border-secondary flex-shrink-0" />
          )}
          <div className="min-w-0">
            {displayName && (
              <h1 className="text-[18px] font-semibold text-text-primary mb-0.5">
                {displayName}
              </h1>
            )}
            <button
              onClick={handleCopy}
              className="font-mono text-[12px] text-text-tertiary hover:text-text-secondary transition-colors"
              title="Copy full address"
            >
              {copied
                ? 'Copied!'
                : displayDomain || displayAddress}
            </button>
          </div>
        </div>

        {displayDescription && (
          <p className="text-[13px] text-text-secondary leading-relaxed mb-5">
            {displayDescription}
          </p>
        )}

        <a
          href={`https://teia.art/tz/${displayAddress}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-[12px] text-accent hover:underline"
        >
          View on teia.art →
        </a>
      </div>
    </div>
  )
}
