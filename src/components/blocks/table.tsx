import type { TableBlock } from '@/payload-types'

import { Section } from '../ui'

export function TableBlockView({ block }: { block: TableBlock }) {
  const columns = block.columns ?? []
  if (!columns.length) return null
  return (
    <Section>
      <div className="overflow-x-auto rounded-(--radius-card) border border-line">
        <table className="w-full min-w-[36rem] border-collapse text-left">
          <caption className="bg-surface p-4 text-left text-lg font-bold">{block.caption}</caption>
          <thead>
            <tr className="border-b border-line bg-surface">
              {columns.map((c, i) => (
                <th key={c.id ?? i} scope="col" className="p-3 font-semibold">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(block.rows ?? []).map((row, ri) => (
              <tr key={row.id ?? ri} className="border-b border-line last:border-0">
                {columns.map((_, ci) => {
                  const value = row.cells?.[ci]?.value ?? ''
                  return ci === 0 ? (
                    <th key={ci} scope="row" className="p-3 font-medium">
                      {value}
                    </th>
                  ) : (
                    <td key={ci} className="p-3 text-ink-soft">
                      {value}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  )
}
