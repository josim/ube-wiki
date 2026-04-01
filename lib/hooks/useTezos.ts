'use client'

import { useEffect } from 'react'
import { useWalletStore } from '@/lib/store/walletStore'
import { useShallow } from 'zustand/react/shallow'

export function useTezos() {
  const { Tezos, setWallet, setKukai, setAddress } = useWalletStore(
    useShallow((s) => ({
      Tezos: s.Tezos,
      setWallet: s.setWallet,
      setKukai: s.setKukai,
      setAddress: s.setAddress,
    }))
  )

  const address = useWalletStore((s) => s.address)
  const role = useWalletStore((s) => s.role)
  const loading = useWalletStore((s) => s.loading)
  const wallet = useWalletStore((s) => s.wallet)
  const kukai = useWalletStore((s) => s.kukai)
  const connectWallet = useWalletStore((s) => s.connectWallet)
  const connectKukai = useWalletStore((s) => s.connectKukai)
  const disconnectWallet = useWalletStore((s) => s.disconnectWallet)

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

        // Restore existing Beacon session
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

        // Only restore Kukai session if no Beacon session was found
        if (!activeAccount) {
          const userInfo = kukaiInstance.user
          if (userInfo) {
            setAddress(userInfo.pkh)
            useWalletStore.getState().checkRoles(userInfo.pkh)
          }
        }
      } catch (error) {
        console.error('Error initializing client libraries:', error)
      }
    }

    initClientLibraries()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Tezos])

  return {
    Tezos,
    wallet,
    kukai,
    address,
    role,
    loading,
    connectWallet,
    connectKukai,
    disconnectWallet,
  }
}
