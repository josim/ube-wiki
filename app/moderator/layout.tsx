import { WikiSidebar } from '@/components/wiki/WikiSidebar'

export default function ModeratorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="w-full border-t border-border-tertiary bg-bg-primary flex-1">
      <div className="flex min-h-[calc(100vh-3rem)]">
        <WikiSidebar />
        <main className="flex-1 flex flex-col overflow-hidden min-w-0">
          {children}
        </main>
      </div>
    </div>
  )
}
