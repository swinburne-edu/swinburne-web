import type { Locale } from '@/lib/i18n/config'
import type { Page } from '@/payload-types'

import { LeadFormSection } from '../lead-form-section'
import { CardGridBlockView } from './card-grid'
import { CtaBlockView } from './cta'
import { FaqListBlockView } from './faq-list'
import { HeroBlockView } from './hero'
import { RichTextBlockView } from './rich-text-block'
import { StatsBlockView } from './stats'
import { TableBlockView } from './table'
import { TestimonialsBlockView } from './testimonials'
import { VideoBlockView } from './video'

export type LayoutBlock = NonNullable<Page['layout']>[number]

/** Khối hero đầu tiên có isPageTitle giữ h1 của trang (-1 nếu không có) */
export function heroTitleIndex(blocks: LayoutBlock[]): number {
  return blocks.findIndex((b) => b.blockType === 'hero' && b.isPageTitle !== false)
}

export function RenderBlocks({ blocks, locale }: { blocks: LayoutBlock[]; locale: Locale }) {
  const h1Index = heroTitleIndex(blocks)
  return (
    <>
      {blocks.map((block, i) => {
        const key = block.id ?? `${block.blockType}-${i}`
        switch (block.blockType) {
          case 'hero':
            return <HeroBlockView key={key} block={block} isH1={i === h1Index} priority={i === 0} />
          case 'richText':
            return <RichTextBlockView key={key} block={block} locale={locale} />
          case 'cardGrid':
            return <CardGridBlockView key={key} block={block} locale={locale} />
          case 'cta':
            return <CtaBlockView key={key} block={block} />
          case 'faqList':
            return <FaqListBlockView key={key} block={block} locale={locale} />
          case 'leadForm':
            return (
              <LeadFormSection
                key={key}
                locale={locale}
                heading={block.heading}
                intro={block.intro}
                anchor={block.anchor}
              />
            )
          case 'video':
            return <VideoBlockView key={key} block={block} locale={locale} />
          case 'table':
            return <TableBlockView key={key} block={block} />
          case 'stats':
            return <StatsBlockView key={key} block={block} />
          case 'testimonials':
            return <TestimonialsBlockView key={key} block={block} locale={locale} />
          default:
            return null
        }
      })}
    </>
  )
}
