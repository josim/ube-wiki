'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { ProposalKind } from '@/lib/multisig/types'
import {
  createAddUserProposal,
  createRemoveUserProposal,
  createTextProposal,
  createTransferMutezProposal,
  createTransferTokenProposal,
  createLambdaFunctionProposal,
  createMinimumVotesProposal,
  createExpirationTimeProposal,
} from '@/lib/multisig/data'
import { withTransaction } from '@/lib/utils/withTransaction'

const KINDS: { value: ProposalKind; label: string }[] = [
  { value: 'add_user', label: 'Add signer' },
  { value: 'remove_user', label: 'Remove signer' },
  { value: 'text', label: 'Text proposal' },
  { value: 'transfer_mutez', label: 'Transfer XTZ' },
  { value: 'transfer_token', label: 'Transfer token' },
  { value: 'minimum_votes', label: 'Change minimum votes' },
  { value: 'expiration_time', label: 'Change expiration' },
]

export function CreateProposalForm({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient()
  const [kind, setKind] = useState<ProposalKind>('text')

  // Form fields
  const [address, setAddress] = useState('')
  const [text, setText] = useState('')
  const [amount, setAmount] = useState('')
  const [destination, setDestination] = useState('')
  const [tokenAddress, setTokenAddress] = useState('')
  const [tokenId, setTokenId] = useState('')
  const [tokenAmount, setTokenAmount] = useState('')
  const [tokenDestination, setTokenDestination] = useState('')
  const [lambdaCode, setLambdaCode] = useState('')
  const [threshold, setThreshold] = useState('')
  const [expiration, setExpiration] = useState('')

  const getProposalFn = (): (() => Promise<string>) => {
    switch (kind) {
      case 'add_user':
        if (!address.trim()) throw new Error('Address required')
        return () => createAddUserProposal(address.trim())
      case 'remove_user':
        if (!address.trim()) throw new Error('Address required')
        return () => createRemoveUserProposal(address.trim())
      case 'text':
        if (!text.trim()) throw new Error('Text required')
        return () => createTextProposal(text.trim())
      case 'transfer_mutez':
        if (!amount || !destination.trim()) throw new Error('Amount and destination required')
        return () => createTransferMutezProposal([
          { amount: Math.round(parseFloat(amount) * 1_000_000), destination: destination.trim() },
        ])
      case 'transfer_token':
        if (!tokenAddress.trim() || !tokenAmount || !tokenDestination.trim())
          throw new Error('Token details required')
        return () => createTransferTokenProposal(
          tokenAddress.trim(),
          parseInt(tokenId || '0', 10),
          [{ amount: parseInt(tokenAmount, 10), destination: tokenDestination.trim() }]
        )
      case 'lambda_function': {
        if (!lambdaCode.trim()) throw new Error('Lambda code required')
        let parsed
        try {
          parsed = JSON.parse(lambdaCode)
        } catch {
          throw new Error('Invalid JSON in lambda code')
        }
        return () => createLambdaFunctionProposal(parsed)
      }
      case 'minimum_votes':
        if (!threshold) throw new Error('Minimum votes value required')
        return () => createMinimumVotesProposal(parseInt(threshold, 10))
      case 'expiration_time':
        if (!expiration) throw new Error('Expiration required')
        return () => createExpirationTimeProposal(parseInt(expiration, 10))
    }
  }

  const handleSubmit = () => {
    try {
      const fn = getProposalFn()
      withTransaction(
        'Creating proposal...',
        fn,
        () => {
          queryClient.invalidateQueries({ queryKey: ['multisig'] })
          onClose()
        }
      )
    } catch (err) {
      // Validation errors (thrown synchronously)
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
        Type
      </label>
      <select
        value={kind}
        onChange={(e) => setKind(e.target.value as ProposalKind)}
        className={inputClass}
      >
        {KINDS.map((k) => (
          <option key={k.value} value={k.value}>
            {k.label}
          </option>
        ))}
      </select>

      {/* Dynamic fields */}
      {(kind === 'add_user' || kind === 'remove_user') && (
        <>
          <label className="block text-[11px] text-text-tertiary uppercase tracking-[0.08em] font-medium mb-1 mt-1">
            Address
          </label>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="tz1..."
            className={inputClass}
          />
        </>
      )}

      {kind === 'text' && (
        <>
          <label className="block text-[11px] text-text-tertiary uppercase tracking-[0.08em] font-medium mb-1 mt-1">
            Text
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Proposal text..."
            className={`${inputClass} min-h-[80px] resize-y`}
          />
        </>
      )}

      {kind === 'transfer_mutez' && (
        <>
          <label className="block text-[11px] text-text-tertiary uppercase tracking-[0.08em] font-medium mb-1 mt-1">
            Amount (XTZ)
          </label>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="1.5"
            type="number"
            step="0.000001"
            className={inputClass}
          />
          <label className="block text-[11px] text-text-tertiary uppercase tracking-[0.08em] font-medium mb-1">
            Destination
          </label>
          <input
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="tz1... or KT1..."
            className={inputClass}
          />
        </>
      )}

      {kind === 'transfer_token' && (
        <>
          <label className="block text-[11px] text-text-tertiary uppercase tracking-[0.08em] font-medium mb-1 mt-1">
            Token contract
          </label>
          <input
            value={tokenAddress}
            onChange={(e) => setTokenAddress(e.target.value)}
            placeholder="KT1..."
            className={inputClass}
          />
          <label className="block text-[11px] text-text-tertiary uppercase tracking-[0.08em] font-medium mb-1">
            Token ID
          </label>
          <input
            value={tokenId}
            onChange={(e) => setTokenId(e.target.value)}
            placeholder="0"
            type="number"
            className={inputClass}
          />
          <label className="block text-[11px] text-text-tertiary uppercase tracking-[0.08em] font-medium mb-1">
            Amount
          </label>
          <input
            value={tokenAmount}
            onChange={(e) => setTokenAmount(e.target.value)}
            placeholder="1"
            type="number"
            className={inputClass}
          />
          <label className="block text-[11px] text-text-tertiary uppercase tracking-[0.08em] font-medium mb-1">
            Destination
          </label>
          <input
            value={tokenDestination}
            onChange={(e) => setTokenDestination(e.target.value)}
            placeholder="tz1..."
            className={inputClass}
          />
        </>
      )}

      {kind === 'lambda_function' && (
        <>
          <label className="block text-[11px] text-text-tertiary uppercase tracking-[0.08em] font-medium mb-1 mt-1">
            Lambda (Michelson JSON)
          </label>
          <textarea
            value={lambdaCode}
            onChange={(e) => setLambdaCode(e.target.value)}
            placeholder='[{"prim": "DROP"}, ...]'
            className={`${inputClass} min-h-[100px] resize-y font-mono text-xs`}
          />
        </>
      )}

      {kind === 'minimum_votes' && (
        <>
          <label className="block text-[11px] text-text-tertiary uppercase tracking-[0.08em] font-medium mb-1 mt-1">
            New minimum votes
          </label>
          <input
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
            placeholder="2"
            type="number"
            min="1"
            className={inputClass}
          />
        </>
      )}

      {kind === 'expiration_time' && (
        <>
          <label className="block text-[11px] text-text-tertiary uppercase tracking-[0.08em] font-medium mb-1 mt-1">
            Expiration (days)
          </label>
          <input
            value={expiration}
            onChange={(e) => setExpiration(e.target.value)}
            placeholder="7"
            type="number"
            min="1"
            className={inputClass}
          />
        </>
      )}

      <div className="flex gap-2 mt-3">
        <button
          onClick={handleSubmit}
          className="text-xs px-3.5 py-1.5 rounded-md bg-accent text-white hover:bg-accent-hover"
        >
          Create proposal
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
