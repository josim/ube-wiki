import { useQuery, keepPreviousData } from '@tanstack/react-query'
import {
  fetchUserProfiles,
  resolveNameToAddress,
  UserProfile,
} from '@/lib/api/users'
import { STALE } from './constants'

function isAddress(input: string): boolean {
  return input.startsWith('tz') || input.startsWith('KT')
}

/** Batch-fetch profiles for multiple addresses. */
export function useUserProfiles(addresses: string[]) {
  const sorted = [...addresses].sort()
  return useQuery({
    queryKey: ['user-profiles', sorted],
    queryFn: () => fetchUserProfiles(sorted),
    enabled: sorted.length > 0,
    staleTime: STALE.PROFILES,
    placeholderData: keepPreviousData,
  })
}

/**
 * Fetch a single profile by address or SUBJKT name.
 * Routes through fetchUserProfiles so SUBJKT + Tezos Domains are both resolved.
 */
export function useUserProfile(addressOrName: string) {
  return useQuery({
    queryKey: ['user-profile', addressOrName],
    queryFn: async (): Promise<UserProfile | null> => {
      let address = addressOrName

      // If it's a name, resolve to address first
      if (!isAddress(addressOrName)) {
        const resolved = await resolveNameToAddress(addressOrName)
        if (!resolved) return null
        address = resolved
      }

      const profiles = await fetchUserProfiles([address])
      return profiles.get(address) ?? { address, name: '', domain: '', avatar: '', description: '' }
    },
    enabled: !!addressOrName,
    staleTime: STALE.PROFILES,
  })
}

/** Helper to extract display info from a profiles Map. */
export function getProfileDisplay(
  profiles: Map<string, UserProfile> | undefined,
  address: string
): { name: string; domain: string; avatar: string } {
  const profile = profiles?.get(address)
  return {
    name: profile?.name || profile?.domain || '',
    domain: profile?.domain || '',
    avatar: profile?.avatar || '',
  }
}
