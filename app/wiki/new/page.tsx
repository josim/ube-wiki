'use client'

import { CreatePageForm } from '@/components/wiki/CreatePageForm'

export default function NewWikiPage() {
  return (
    <>
      <div className="px-[22px] pt-[18px] pb-3.5 border-b border-border-tertiary flex-shrink-0 bg-bg-primary">
        <h1 className="text-[17px] font-medium text-text-primary">
          New Page
        </h1>
      </div>
      <CreatePageForm />
    </>
  )
}
