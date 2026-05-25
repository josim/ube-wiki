'use client'

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

interface SeriesDef {
  key: string
  label: string
  color: string
}

interface TimeSeriesChartProps<T> {
  title: string
  data: T[]
  xKey: keyof T & string
  series: SeriesDef[]
  height?: number
  emptyHint?: string
}

export function TimeSeriesChart<T extends object>({
  title,
  data,
  xKey,
  series,
  height = 200,
  emptyHint = 'No data yet.',
}: TimeSeriesChartProps<T>) {
  return (
    <div className="border border-border-tertiary rounded-lg bg-bg-secondary">
      <div className="px-4 py-2.5 border-b border-border-tertiary text-[11px] text-text-tertiary uppercase tracking-[0.08em] font-medium">
        {title}
      </div>
      {data.length === 0 ? (
        <div className="px-4 py-6 text-[12px] text-text-tertiary">{emptyHint}</div>
      ) : (
        <div className="px-2 py-3">
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={data} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 3" stroke="var(--color-border-tertiary)" />
              <XAxis
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                dataKey={xKey as any}
                tick={{ fontSize: 10, fill: 'var(--color-text-tertiary)' }}
                tickLine={false}
                axisLine={{ stroke: 'var(--color-border-tertiary)' }}
                minTickGap={24}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'var(--color-text-tertiary)' }}
                tickLine={false}
                axisLine={{ stroke: 'var(--color-border-tertiary)' }}
                width={32}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  background: 'var(--color-background-primary)',
                  border: '1px solid var(--color-border-tertiary)',
                  borderRadius: 6,
                  fontSize: 12,
                }}
                labelStyle={{ color: 'var(--color-text-secondary)' }}
              />
              {series.map((s) => (
                <Area
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.label}
                  stroke={s.color}
                  fill={s.color}
                  fillOpacity={0.15}
                  strokeWidth={1.5}
                  stackId={series.length > 1 ? 'stack' : undefined}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
