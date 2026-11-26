'use client'

import { useState } from 'react'

type Props = { videoId: string; title: string; poster: string; playLabel: string }

/** Chỉ nhúng iframe YouTube khi người dùng bấm phát → không tải ~1MB JS của YouTube lúc vào trang. */
export function YouTubeLite({ videoId, title, poster, playLabel }: Props) {
  const [active, setActive] = useState(false)
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-(--radius-card) bg-black">
      {active ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      ) : (
        <button
          type="button"
          onClick={() => setActive(true)}
          className="group absolute inset-0 h-full w-full"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={poster}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover opacity-90"
          />
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand text-white shadow-lg transition-transform group-hover:scale-110">
              <svg
                aria-hidden="true"
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </span>
          <span className="sr-only">
            {playLabel}: {title}
          </span>
        </button>
      )}
    </div>
  )
}
