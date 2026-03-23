'use client'

import { useEffect } from 'react'
import { useWalletStore } from '@/lib/store/walletStore'

export function useTezos() {
  const store = useWalletStore()
  const { Tezos, setWallet, setKukai, setAddress } = store

  useEffect(() => {
    const initClientLibraries = async () => {
      try {
        const { BeaconWallet } = await import('@taquito/beacon-wallet')
        const { KukaiEmbed, Networks } = await import('kukai-embed')
        const { NetworkType } = await import('@airgap/beacon-dapp')

        // Initialize BeaconWallet
        const walletInstance = new BeaconWallet({
          name: 'Teia Wiki',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          preferredNetwork: NetworkType.SHADOWNET as any,
        })
        Tezos.setWalletProvider(walletInstance)
        setWallet(walletInstance)

        // Restore existing session
        const activeAccount = await walletInstance.client.getActiveAccount()
        if (activeAccount) {
          setAddress(activeAccount.address)
          useWalletStore.getState().checkRoles(activeAccount.address)
        }

        // Initialize Kukai
        const kukaiInstance = new KukaiEmbed({
          net: Networks.ghostnet,
        })
        await kukaiInstance.init()
        setKukai(kukaiInstance)

        // Check existing Kukai session
        const userInfo = kukaiInstance.user
        if (userInfo) {
          setAddress(userInfo.pkh)
          useWalletStore.getState().checkRoles(userInfo.pkh)
        }
      } catch (error) {
        console.error('Error initializing client libraries:', error)
      }
    }

    initClientLibraries()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Tezos])

  return store
}
