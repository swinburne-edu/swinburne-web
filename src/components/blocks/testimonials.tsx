import type { Locale } from '@/lib/i18n/config'
import { getLatestTestimonials } from '@/lib/queries'
import type { Testimonial, TestimonialsBlock } from '@/payload-types'

import { MediaImage } from '../media-image'
import { Section, SectionHeading } from '../ui'

export async function TestimonialsBlockView({
  block,
  locale,
}: {
  block: TestimonialsBlock
  locale: Locale
}) {
  let items = (block.testimonials ?? []).filter(
    (t): t is Testimonial => typeof t === 'object' && t !== null && Boolean(t.quote),
  )
  if (!items.length) items = await getLatestTestimonials(locale, 3)
  if (!items.length) return null
  const headingId = `tm-${block.id ?? 'list'}`
  return (
    <Section tone="surface" labelledBy={block.heading ? headingId : undefined}>
      {block.heading ? <SectionHeading id={headingId} title={block.heading} /> : null}
      <ul className="grid gap-6 md:grid-cols-3">
        {items.map((t) => (
          <li key={t.id}>
            <figure className="flex h-full flex-col rounded-(--radius-card) border border-line bg-white p-6 shadow-sm">
              <blockquote className="flex-1 text-lg leading-relaxed text-ink-soft">
                <p>“{t.quote}”</p>
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                {t.photo ? (
                  <MediaImage
                    media={t.photo}
                    prefer="thumb"
                    sizes="56px"
                    className="h-14 w-14 rounded-full"
                  />
                ) : (
                  <span
                    aria-hidden="true"
                    className="flex h-14 w-14 items-center justify-center rounded-full bg-brand text-lg font-bold text-white"
                  >
                    {t.name.charAt(0)}
                  </span>
                )}
                <span>
                  <span className="block font-semibold">{t.name}</span>
                  {t.role ? <span className="block text-sm text-muted">{t.role}</span> : null}
                </span>
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </Section>
  )
}
