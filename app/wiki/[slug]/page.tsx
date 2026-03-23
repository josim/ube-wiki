import { Metadata } from 'next'
import { slugToTitle } from '@/lib/wiki/types'
import WikiSlugClient from './WikiSlugClient'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const title = slugToTitle(slug)
  return {
    title: `${title} — Teia Wiki`,
    description: `${title} — an on-chain wiki page on Teia DAO.`,
  }
}

export default function WikiSlugPage() {
  return <WikiSlugClient />
}
