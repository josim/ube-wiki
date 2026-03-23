import Link from 'next/link'

export function Landing() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center gap-5 px-6 text-center">
      <div className="flex items-center gap-2">
        <span className="w-3 h-3 rounded-full bg-accent" />
        <h1 className="text-2xl font-medium text-text-primary tracking-tight">
          teia wiki
        </h1>
      </div>
      <p className="text-text-secondary text-sm max-w-sm leading-relaxed">
        A fully on-chain, decentralized wiki for the teia community.
        Content lives on IPFS. Access is enforced by smart contracts.
      </p>
      <Link
        href="/wiki"
        className="mt-2 px-4 py-2 text-[13px] rounded-md bg-accent text-white hover:bg-accent-hover transition-colors"
      >
        Browse wiki
      </Link>
    </div>
  )
}
