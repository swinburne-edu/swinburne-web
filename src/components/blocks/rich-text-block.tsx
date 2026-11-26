import type { Locale } from '@/lib/i18n/config'
import type { RichTextBlock } from '@/payload-types'

import { RichText } from '../rich-text'
import { Section } from '../ui'

export function RichTextBlockView({ block, locale }: { block: RichTextBlock; locale: Locale }) {
  return (
    <Section>
      <RichText data={block.content} locale={locale} className="mx-auto max-w-3xl" />
    </Section>
  )
}
