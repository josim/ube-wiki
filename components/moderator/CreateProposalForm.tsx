'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { ModeratorActionKind } from '@/lib/moderator/types'
import {
  submitAddModeratorProposal,
  submitRemoveModeratorProposal,
  submitUpdateMultisigProposal,
  submitUpdateMetadataProposal,
} from '@/lib/moderator/data'
import { withTransaction } from '@/lib/utils/withTransaction'

const ACTIONS: { value: ModeratorActionKind; label: string }[] = [
  { value: 'add_moderator', label: 'Add moderator' },
  { value: 'remove_moderator', label: 'Remove moderator' },
  { value: 'update_multisig_address', label: 'Update multisig address' },
  { value: 'update_metadata', label: 'Update metadata' },
]

export function CreateProposalForm({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient()
  const [action, setAction] = useState<ModeratorActionKind>('add_moderator')

  const [address, setAddress] = useState('')
  const [metadataKey, setMetadataKey] = useState('')
  const [metadataValue, setMetadataValue] = useState('')

  const getProposalFn = (): (() => Promise<string>) => {
    switch (action) {
      case 'add_moderator':
        if (!address.trim()) throw new Error('Address required')
        return () => submitAddModeratorProposal(address.trim())
      case 'remove_moderator':
        if (!address.trim()) throw new Error('Address required')
        return () => submitRemoveModeratorProposal(address.trim())
      case 'update_multisig_address':
        if (!address.trim()) throw new Error('Address required')
        return () => submitUpdateMultisigProposal(address.trim())
      case 'update_metadata':
        if (!metadataKey.trim()) throw new Error('Key required')
        return () => submitUpdateMetadataProposal(metadataKey.trim(), metadataValue)
    }
  }

  const handleSubmit = () => {
    try {
      const fn = getProposalFn()
      withTransaction(
        'Submitting proposal...',
        fn,
        () => {
          queryClient.invalidateQueries({ queryKey: ['moderator'] })
          onClose()
        }
      )
    } catch (err) {
      alert((err as Error).message)
    }
  }

  const inputClass =
    'w-full py-1.5 px-3 border border-border-secondary rounded-md bg-bg-secondary text-text-primary text-[13px] mb-2 focus:outline-none focus:border-accent'

  return (
    <div className="border border-border-tertiary rounded-lg px-5 py-4 mb-4">
      <h3 className="text-[14px] font-medium text-text-primary mb-3">
        New Proposal
      </h3>

      <label className="block text-[11px] text-text-tertiary uppercase tracking-[0.08em] font-medium mb-1">
        Action
      </label>
      <select
        value={action}
        onChange={(e) => setAction(e.target.value as ModeratorActionKind)}
        className={inputClass}
      >
        {ACTIONS.map((a) => (
          <option key={a.value} value={a.value}>
            {a.label}
          </option>
        ))}
      </select>

      {(action === 'add_moderator' ||
        action === 'remove_moderator' ||
        action === 'update_multisig_address') && (
        <>
          <label className="block text-[11px] text-text-tertiary uppercase tracking-[0.08em] font-medium mb-1 mt-1">
            Address
          </label>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="tz1... or KT1..."
            className={inputClass}
          />
        </>
      )}

      {action === 'update_metadata' && (
        <>
          <label className="block text-[11px] text-text-tertiary uppercase tracking-[0.08em] font-medium mb-1 mt-1">
            Key
          </label>
          <input
            value={metadataKey}
            onChange={(e) => setMetadataKey(e.target.value)}
            placeholder="e.g. name"
            className={inputClass}
          />
          <label className="block text-[11px] text-text-tertiary uppercase tracking-[0.08em] font-medium mb-1">
            Value
          </label>
          <input
            value={metadataValue}
            onChange={(e) => setMetadataValue(e.target.value)}
            placeholder="Value (bytes)"
            className={inputClass}
          />
        </>
      )}

      <div className="flex gap-2 mt-3">
        <button
          onClick={handleSubmit}
          className="text-xs px-3.5 py-1.5 rounded-md bg-accent text-white hover:bg-accent-hover"
        >
          Submit proposal
        </button>
        <button
          onClick={onClose}
          className="text-xs px-3.5 py-1 rounded-md border border-border-secondary text-text-secondary hover:bg-bg-secondary hover:text-text-primary"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
