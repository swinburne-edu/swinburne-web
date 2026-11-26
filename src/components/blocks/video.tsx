import type { Locale } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n/dictionary'
import { imageSource } from '@/lib/media'
import type { VideoBlock } from '@/payload-types'

import { Section } from '../ui'
import { YouTubeLite } from './youtube-lite'

export function youtubeId(url: string): string | null {
  const m =
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/))([\w-]{11})/.exec(
      url,
    )
  return m ? m[1]! : null
}

export function VideoBlockView({ block, locale }: { block: VideoBlock; locale: Locale }) {
  const id = youtubeId(block.youtubeUrl)
  if (!id) return null
  const poster =
    imageSource(block.poster, 'content')?.src ?? `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
  return (
    <Section>
      <div className="mx-auto max-w-4xl">
        <h2 className="mb-4 text-2xl font-bold">{block.title}</h2>
        <YouTubeLite
          videoId={id}
          title={block.title}
          poster={poster}
          playLabel={getDictionary(locale).playVideo}
        />
      </div>
    </Section>
  )
}
