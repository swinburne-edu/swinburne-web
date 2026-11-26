import type { Locale } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n/dictionary'
import { getFaqsByGroup } from '@/lib/queries'
import { faqPageJsonLd } from '@/lib/seo/jsonld'
import type { Faq, FaqListBlock } from '@/payload-types'

import { JsonLd } from '../json-ld'
import { RichText } from '../rich-text'
import { Section, SectionHeading } from '../ui'

export function FaqAccordion({ faqs, locale }: { faqs: Faq[]; locale: Locale }) {
  return (
    <div className="divide-y divide-line rounded-(--radius-card) border border-line bg-white">
      {faqs.map((f) => (
        <details key={f.id} className="group p-5 [&_summary::-webkit-details-marker]:hidden">
          <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-lg font-semibold">
            <span>{f.question}</span>
            <span
              aria-hidden="true"
              className="mt-1 shrink-0 text-brand transition-transform group-open:rotate-45"
            >
              +
            </span>
          </summary>
          <RichText data={f.answer} locale={locale} className="mt-3" />
        </details>
      ))}
    </div>
  )
}

export async function FaqListBlockView({ block, locale }: { block: FaqListBlock; locale: Locale }) {
  const t = getDictionary(locale)
  let faqs = (block.faqs ?? []).filter(
    (f): f is Faq => typeof f === 'object' && f !== null && Boolean(f.question),
  )
  if (!faqs.length && block.group) faqs = await getFaqsByGroup(locale, block.group)
  if (!faqs.length) return null
  const headingId = `faq-${block.id ?? 'list'}`
  return (
    <Section tone="surface" labelledBy={headingId}>
      <div className="mx-auto max-w-3xl">
        <SectionHeading id={headingId} title={block.heading || t.faqs} />
        <FaqAccordion faqs={faqs} locale={locale} />
      </div>
      <JsonLd data={faqPageJsonLd(faqs)} />
    </Section>
  )
}
