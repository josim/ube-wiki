import { create } from 'zustand'
import { TezosToolkit } from '@taquito/taquito'
import { RPC_URL, MODERATOR_CONTRACT, MULTISIG_CONTRACT, TEIA_TOKEN_CONTRACT } from '@/lib/constants'

export type UserRole = 'visitor' | 'holder' | 'moderator' | 'multisig'

/** Can create/edit pages directly (moderators and multisig users) */
export function canEditPages(role: UserRole): boolean {
  return role === 'moderator' || role === 'multisig'
}

interface WalletState {
  Tezos: TezosToolkit
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  wallet: any | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  kukai: any | null
  address: string | null
  role: UserRole
  loading: boolean

  connectWallet: () => Promise<void>
  connectKukai: () => Promise<void>
  disconnectWallet: () => Promise<void>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setWallet: (wallet: any) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setKukai: (kukai: any) => void
  setAddress: (address: string | null) => void
  setRole: (role: UserRole) => void
  checkRoles: (address: string) => Promise<void>
}

// Cache role checks to avoid re-running RPC calls on every navigation
const roleCache = new Map<string, { role: UserRole; ts: number }>()
const ROLE_CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export const useWalletStore = create<WalletState>((set, get) => ({
  Tezos: new TezosToolkit(RPC_URL),
  wallet: null,
  kukai: null,
  address: null,
  role: 'visitor',
  loading: false,

  connectWallet: async () => {
    const { wallet } = get()
    if (!wallet) return
    set({ loading: true })
    try {
      await wallet.requestPermissions()
      const address = await wallet.getPKH()
      set({ address })
      await get().checkRoles(address)
    } catch (err) {
      console.error('Wallet connect failed:', err)
    } finally {
      set({ loading: false })
    }
  },

  connectKukai: async () => {
    const { kukai } = get()
    if (!kukai) return
    set({ loading: true })
    try {
      const userInfo = await kukai.login({ wideButtons: [true, false] })
      set({ address: userInfo.pkh })
      await get().checkRoles(userInfo.pkh)
    } catch (err) {
      console.error('Kukai connect failed:', err)
    } finally {
      set({ loading: false })
    }
  },

  disconnectWallet: async () => {
    const { wallet, kukai, address } = get()
    if (address) roleCache.delete(address)
    if (wallet) {
      await wallet.client.clearActiveAccount()
    }
    if (kukai) {
      kukai.logout()
    }
    set({ address: null, role: 'visitor' })
  },

  setWallet: (wallet) => set({ wallet }),
  setKukai: (kukai) => set({ kukai }),
  setAddress: (address) => set({ address }),
  setRole: (role) => set({ role }),

  checkRoles: async (address: string) => {
    // Return cached role if still fresh
    const cached = roleCache.get(address)
    if (cached && Date.now() - cached.ts < ROLE_CACHE_TTL) {
      set({ role: cached.role })
      return
    }

    const { Tezos } = get()
    let role: UserRole = 'visitor'

    // Check moderator status via on-chain view
    try {
      const modContract = await Tezos.contract.at(MODERATOR_CONTRACT)
      const isMod = await modContract.contractViews
        .is_moderator(address)
        .executeView({ viewCaller: MODERATOR_CONTRACT })
      if (isMod) {
        roleCache.set(address, { role: 'moderator', ts: Date.now() })
        set({ role: 'moderator' })
        return
      }
    } catch (err) {
      console.warn('Moderator check failed:', err)
    }

    // Check multisig user status via on-chain view
    try {
      const msContract = await Tezos.contract.at(MULTISIG_CONTRACT)
      const isUser = await msContract.contractViews
        .is_user(address)
        .executeView({ viewCaller: MULTISIG_CONTRACT })
      if (isUser) {
        roleCache.set(address, { role: 'multisig', ts: Date.now() })
        set({ role: 'multisig' })
        return
      }
    } catch (err) {
      console.warn('Multisig check failed:', err)
    }

    // Check Teia token balance (when token contract is deployed)
    if (TEIA_TOKEN_CONTRACT) {
      try {
        const tokenContract = await Tezos.contract.at(TEIA_TOKEN_CONTRACT)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const storage = await tokenContract.storage<any>()
        const balance = await storage.ledger.get(address)
        if (balance && balance.toNumber() > 0) {
          role = 'holder'
        }
      } catch (err) {
        console.warn('Token balance check failed:', err)
      }
    }

    roleCache.set(address, { role, ts: Date.now() })
    set({ role })
  },
}))
