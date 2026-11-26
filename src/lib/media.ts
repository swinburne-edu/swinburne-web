import type { Media } from '@/payload-types'

/**
 * URL công khai của file media. Production: Nginx phục vụ thẳng /media/* từ MEDIA_DIR.
 * Local: next.config rewrite /media/* → /api/media/file/*.
 */
export function mediaUrl(filename: string | null | undefined): string | null {
  return filename ? `/media/${encodeURIComponent(filename)}` : null
}

export type ImageSource = {
  src: string
  srcSet?: string
  width?: number
  height?: number
  alt: string
}

const SIZE_ORDER = ['thumb', 'card', 'content', 'hero'] as const
type SizeName = (typeof SIZE_ORDER)[number]

export function isMedia(value: unknown): value is Media {
  return typeof value === 'object' && value !== null && 'id' in value && 'filename' in value
}

/**
 * Dựng src/srcset từ các size Payload đã sinh sẵn (không để Next tối ưu ảnh lúc chạy).
 * `prefer` chọn size làm src mặc định.
 */
export function imageSource(
  media: Media | number | null | undefined,
  prefer: SizeName | 'original' = 'card',
): ImageSource | null {
  if (!isMedia(media)) return null
  const original = mediaUrl(media.filename)
  if (!original) return null
  const alt = media.alt ?? ''

  if (media.mimeType === 'image/svg+xml' || !media.mimeType?.startsWith('image/')) {
    return {
      src: original,
      alt,
      width: media.width ?? undefined,
      height: media.height ?? undefined,
    }
  }

  const candidates: { url: string; width: number; height?: number; name: SizeName | 'original' }[] =
    []
  for (const name of SIZE_ORDER) {
    const s = media.sizes?.[name]
    const url = mediaUrl(s?.filename)
    if (url && s?.width)
      candidates.push({ url, width: s.width, height: s.height ?? undefined, name })
  }
  if (media.width)
    candidates.push({
      url: original,
      width: media.width,
      height: media.height ?? undefined,
      name: 'original',
    })

  // srcset chỉ gồm các size cùng tỉ lệ khung với size được chọn (tránh nhảy bố cục)
  const chosen = candidates.find((c) => c.name === prefer) ?? candidates[candidates.length - 1]
  if (!chosen) return { src: original, alt }

  const ratio = chosen.height ? chosen.width / chosen.height : null
  const sameRatio = candidates.filter((c) => {
    if (!ratio || !c.height)
      return c.name === chosen.name || (!ratio && (c.name === 'content' || c.name === 'original'))
    return Math.abs(c.width / c.height - ratio) < 0.02
  })
  const unique = [...new Map(sameRatio.map((c) => [c.width, c])).values()].sort(
    (a, b) => a.width - b.width,
  )

  return {
    src: chosen.url,
    srcSet: unique.length > 1 ? unique.map((c) => `${c.url} ${c.width}w`).join(', ') : undefined,
    width: chosen.width,
    height: chosen.height,
    alt,
  }
}
