import type { StatsBlock } from '@/payload-types'

import { Section } from '../ui'

export function StatsBlockView({ block }: { block: StatsBlock }) {
  const items = block.items ?? []
  if (!items.length) return null
  return (
    <Section tone="dark">
      {block.heading ? (
        <h2 className="mb-8 text-2xl font-bold md:text-3xl">{block.heading}</h2>
      ) : null}
      <dl className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-6">
        {items.map((it, i) => (
          <div key={it.id ?? i} className="border-l-4 border-brand pl-4">
            <dt className="order-2 mt-1 text-sm text-white/80">{it.label}</dt>
            <dd className="text-3xl font-bold text-white md:text-4xl">{it.value}</dd>
          </div>
        ))}
      </dl>
    </Section>
  )
}
