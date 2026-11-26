import type { Media } from '@/payload-types'

import { MediaImage } from './media-image'

/** Logo từ siteSettings; chưa upload thì dùng wordmark chữ (tạm thời). */
export function Logo({ logo }: { logo?: Media | number | null }) {
  if (logo && typeof logo === 'object') {
    return (
      <MediaImage
        media={logo}
        prefer="original"
        priority
        className="h-10 w-auto object-contain lg:h-12"
        alt=""
      />
    )
  }
  return (
    <span className="flex flex-col leading-none" aria-hidden="true">
      <span className="text-xl font-bold tracking-[0.18em] text-brand lg:text-2xl">SWINBURNE</span>
      <span className="text-[0.65rem] font-semibold tracking-[0.3em] text-ink-soft lg:text-xs">
        VIỆT NAM
      </span>
    </span>
  )
}
