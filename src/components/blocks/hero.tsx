import type { HeroBlock } from '@/payload-types'

import { MediaImage } from '../media-image'
import { ButtonLink } from '../ui'

export function HeroBlockView({
  block,
  isH1,
  priority,
}: {
  block: HeroBlock
  isH1: boolean
  priority: boolean
}) {
  const Heading = isH1 ? 'h1' : 'h2'
  const hasImage = Boolean(block.image)
  return (
    <section className="relative isolate overflow-hidden bg-dark text-white">
      {hasImage ? (
        <div className="absolute inset-0 -z-10">
          <MediaImage
            media={block.image}
            prefer="hero"
            sizes="100vw"
            priority={priority}
            className="h-full w-full"
            alt=""
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-black/20" />
        </div>
      ) : (
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-brand-dark via-brand to-[#e8574f]" />
      )}
      <div className="container-site flex min-h-[26rem] flex-col justify-center py-16 md:min-h-[32rem] md:py-24">
        <div className="max-w-3xl">
          <Heading className="text-3xl leading-tight font-bold md:text-5xl">
            {block.heading}
          </Heading>
          {block.subheading ? (
            <p className="mt-4 text-lg text-white/90 md:text-xl">{block.subheading}</p>
          ) : null}
          <div className="mt-8 flex flex-wrap gap-3">
            {block.primaryCta?.label && block.primaryCta.url ? (
              <ButtonLink
                href={block.primaryCta.url}
                size="lg"
                {...(block.primaryCta.url.includes('dang-ky') ||
                block.primaryCta.url.includes('register')
                  ? { 'data-lead-dialog': '' }
                  : {})}
              >
                {block.primaryCta.label}
              </ButtonLink>
            ) : null}
            {block.secondaryCta?.label && block.secondaryCta.url ? (
              <ButtonLink href={block.secondaryCta.url} size="lg" variant="light">
                {block.secondaryCta.label}
              </ButtonLink>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}
