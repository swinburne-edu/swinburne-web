'use client'

import { useEffect } from 'react'

import {
  ATTRIBUTION_COOKIE,
  ATTRIBUTION_MAX_AGE_DAYS,
  parseAttribution,
  readCookie,
  serializeAttribution,
} from '@/lib/attribution'

/** Lưu UTM/gclid/fbclid của lần vào trang đầu tiên (first-touch) vào cookie first-party 30 ngày. */
export function AttributionCapture() {
  useEffect(() => {
    try {
      if (readCookie(document.cookie, ATTRIBUTION_COOKIE)) return
      const attribution = parseAttribution(new URLSearchParams(window.location.search))
      if (!attribution) return
      const maxAge = ATTRIBUTION_MAX_AGE_DAYS * 24 * 3600
      const secure = window.location.protocol === 'https:' ? '; Secure' : ''
      document.cookie = `${ATTRIBUTION_COOKIE}=${serializeAttribution(attribution)}; Max-Age=${maxAge}; Path=/; SameSite=Lax${secure}`
    } catch {
      // cookie bị chặn — bỏ qua
    }
  }, [])
  return null
}
