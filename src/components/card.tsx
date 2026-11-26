import clsx from 'clsx'
import Link from 'next/link'
import type { ReactNode } from 'react'

import type { Media } from '@/payload-types'

import { MediaImage } from './media-image'

type CardProps = {
  title: string
  href?: string | null
  image?: Media | number | null
  meta?: ReactNode
  text?: string | null
  badge?: ReactNode
  headingLevel?: 'h2' | 'h3'
  sizes?: string
}

/** Thẻ nội dung. Cả thẻ bấm được nhờ link phủ (giữ một link duy nhất cho trình đọc màn hình). */
export function Card({
  title,
  href,
  image,
  meta,
  text,
  badge,
  headingLevel = 'h3',
  sizes,
}: CardProps) {
  const Heading = headingLevel
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-(--radius-card) border border-line bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="aspect-[4/3] w-full overflow-hidden bg-surface">
        {image ? (
          <MediaImage
            media={image}
            prefer="card"
            sizes={sizes ?? '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw'}
            className="h-full w-full transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div
            aria-hidden="true"
            className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand to-brand-dark"
          >
            <span className="text-3xl font-bold text-white/80">SWIN</span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        {badge ? <div>{badge}</div> : null}
        {meta ? <div className="text-sm text-muted">{meta}</div> : null}
        <Heading
          className={clsx(
            'line-clamp-3 text-lg font-semibold leading-snug',
            href && 'group-hover:text-brand',
          )}
        >
          {href ? (
            <Link href={href} className="after:absolute after:inset-0 after:content-['']">
              {title}
            </Link>
          ) : (
            title
          )}
        </Heading>
        {text ? <p className="line-clamp-3 text-ink-soft">{text}</p> : null}
      </div>
    </article>
  )
}

export function CardGrid({ children, columns = 3 }: { children: ReactNode; columns?: 2 | 3 | 4 }) {
  return (
    <div
      className={clsx(
        'grid gap-6 sm:grid-cols-2',
        columns === 3 && 'lg:grid-cols-3',
        columns === 4 && 'lg:grid-cols-4',
      )}
    >
      {children}
    </div>
  )
}
