import { useQuery } from '@tanstack/react-query'
import {
  fetchUserProfiles,
  fetchUserByAddress,
  fetchUserByName,
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
  })
}

/** Fetch a single profile by address or SUBJKT name. */
export function useUserProfile(addressOrName: string) {
  return useQuery({
    queryKey: ['user-profile', addressOrName],
    queryFn: () =>
      isAddress(addressOrName)
        ? fetchUserByAddress(addressOrName)
        : fetchUserByName(addressOrName),
    enabled: !!addressOrName,
    staleTime: STALE.PROFILES,
  })
}

/** Helper to extract display info from a profiles Map. */
export function getProfileDisplay(
  profiles: Map<string, UserProfile> | undefined,
  address: string
): { name: string; avatar: string } {
  const profile = profiles?.get(address)
  return {
    name: profile?.name || '',
    avatar: profile?.avatar || '',
  }
}
