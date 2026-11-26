import clsx from 'clsx'

import type { CtaBlock } from '@/payload-types'

import { ButtonLink, Container } from '../ui'

const isRegister = (url: string) => /dang-ky|register|#dang-ky/.test(url)

export function CtaBlockView({ block }: { block: CtaBlock }) {
  const tone = block.tone ?? 'brand'
  return (
    <section
      className={clsx(
        'py-14',
        tone === 'brand' && 'bg-brand text-white',
        tone === 'dark' && 'bg-dark text-white',
        tone === 'light' && 'bg-surface text-ink',
      )}
    >
      <Container className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold md:text-3xl">{block.heading}</h2>
          {block.text ? <p className="mt-2 text-lg opacity-90">{block.text}</p> : null}
        </div>
        <div className="flex flex-wrap gap-3">
          {block.primary?.label && block.primary.url ? (
            <ButtonLink
              href={block.primary.url}
              size="lg"
              variant={tone === 'light' ? 'primary' : 'light'}
              {...(isRegister(block.primary.url) ? { 'data-lead-dialog': '' } : {})}
            >
              {block.primary.label}
            </ButtonLink>
          ) : null}
          {block.secondary?.label && block.secondary.url ? (
            <ButtonLink
              href={block.secondary.url}
              size="lg"
              variant="secondary"
              className={tone === 'light' ? undefined : 'text-white hover:bg-white/10'}
            >
              {block.secondary.label}
            </ButtonLink>
          ) : null}
        </div>
      </Container>
    </section>
  )
}
