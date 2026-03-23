'use client'

import { useParams } from 'next/navigation'
import { ProfilePage } from '@/components/profile/ProfilePage'

export default function ProfileRoute() {
  const params = useParams()
  return <ProfilePage addressOrName={params.addressOrName as string} />
}
