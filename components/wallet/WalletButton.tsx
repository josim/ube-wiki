'use client'

import { useTezos } from '@/lib/hooks/useTezos'
import { UserRole } from '@/lib/store/walletStore'
import { truncateAddress } from '@/lib/utils'

const roleBadge: Record<UserRole, { className: string; label: string }> = {
  moderator: {
    className: 'bg-success-bg text-success-text',
    label: 'Moderator',
  },
  multisig: {
    className: 'bg-success-bg text-success-text',
    label: 'Multisig',
  },
  holder: {
    className: 'bg-info-bg text-info-text',
    label: 'Token holder',
  },
  visitor: { className: '', label: '' },
}

export function WalletButton() {
  const { address, role, loading, connectWallet, disconnectWallet } = useTezos()

  if (loading) {
    return (
      <button
        disabled
        className="text-[13px] px-3.5 py-1.5 rounded-md border border-border-secondary text-text-tertiary"
      >
        connecting…
      </button>
    )
  }

  if (address) {
    return (
      <div className="flex items-center gap-1.5">
        {role !== 'visitor' && (
          <span
            className={`text-[11px] px-2 py-0.5 rounded-md font-medium ${roleBadge[role].className}`}
          >
            {roleBadge[role].label}
          </span>
        )}
        <button
          onClick={disconnectWallet}
          className="text-xs font-mono px-3.5 py-1.5 rounded-md border border-border-secondary text-text-primary hover:bg-bg-secondary transition-colors"
          title={address}
        >
          {truncateAddress(address)}
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={connectWallet}
      className="text-[13px] px-3.5 py-1.5 rounded-md border border-border-secondary text-text-primary hover:bg-bg-secondary transition-colors"
    >
      Connect wallet
    </button>
  )
}
