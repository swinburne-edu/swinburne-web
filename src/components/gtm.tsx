'use client'

import { useEffect } from 'react'

/**
 * Google Tag Manager — mã theo dõi DUY NHẤT của site (CLAUDE.md mục 10).
 * Nạp sau tương tác đầu tiên hoặc khi trình duyệt rảnh (tối đa 5s) để không ảnh hưởng LCP/INP.
 */
export function GoogleTagManager({ gtmId }: { gtmId: string }) {
  useEffect(() => {
    if (!/^GTM-[A-Z0-9]+$/.test(gtmId)) return
    let loaded = false
    const events = ['pointerdown', 'keydown', 'scroll', 'touchstart'] as const

    const load = () => {
      if (loaded) return
      loaded = true
      events.forEach((e) => window.removeEventListener(e, load))
      window.dataLayer = window.dataLayer || []
      window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' })
      const s = document.createElement('script')
      s.async = true
      s.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(gtmId)}`
      document.head.appendChild(s)
    }

    events.forEach((e) => window.addEventListener(e, load, { once: true, passive: true }))
    const idle = window.requestIdleCallback
      ? window.requestIdleCallback(load, { timeout: 5000 })
      : window.setTimeout(load, 3500)

    return () => {
      events.forEach((e) => window.removeEventListener(e, load))
      if (window.cancelIdleCallback && typeof idle === 'number') window.cancelIdleCallback(idle)
    }
  }, [gtmId])

  return null
}
