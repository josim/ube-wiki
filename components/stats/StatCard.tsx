interface StatCardProps {
  label: string
  value: number | string
  sublabel?: string
}

export function StatCard({ label, value, sublabel }: StatCardProps) {
  const display =
    typeof value === 'number' ? value.toLocaleString() : value
  return (
    <div className="border border-border-tertiary rounded-lg px-4 py-3 bg-bg-secondary">
      <div className="text-[11px] text-text-tertiary uppercase tracking-[0.08em] font-medium mb-1">
        {label}
      </div>
      <div className="text-[22px] font-semibold text-text-primary leading-tight">
        {display}
      </div>
      {sublabel && (
        <div className="text-[11px] text-text-tertiary mt-1">{sublabel}</div>
      )}
    </div>
  )
}
