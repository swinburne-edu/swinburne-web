import clsx from 'clsx'

import { imageSource } from '@/lib/media'
import type { Media } from '@/payload-types'

type Props = {
  media: Media | number | null | undefined
  /** Size mặc định làm src */
  prefer?: 'thumb' | 'card' | 'content' | 'hero' | 'original'
  /** Thuộc tính sizes cho srcset, vd "(min-width: 1024px) 33vw, 100vw" */
  sizes?: string
  className?: string
  /** Ảnh LCP (hero đầu trang): tải ngay, ưu tiên cao */
  priority?: boolean
  alt?: string
}

/**
 * Ảnh từ Payload: dùng thẳng các size WebP đã sinh qua srcset/sizes.
 * Không qua next/image để tránh tối ưu lại lúc chạy (tiết kiệm CPU máy chủ).
 */
export function MediaImage({
  media,
  prefer = 'card',
  sizes = '100vw',
  className,
  priority,
  alt,
}: Props) {
  const src = imageSource(media, prefer)
  if (!src) return null
  const focal =
    typeof media === 'object' && media?.focalX != null && media.focalY != null
      ? `${media.focalX}% ${media.focalY}%`
      : undefined
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src.src}
      srcSet={src.srcSet}
      sizes={src.srcSet ? sizes : undefined}
      width={src.width}
      height={src.height}
      alt={alt ?? src.alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
      fetchPriority={priority ? 'high' : undefined}
      className={clsx('object-cover', className)}
      style={focal ? { objectPosition: focal } : undefined}
    />
  )
}
