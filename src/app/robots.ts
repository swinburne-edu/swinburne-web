import type { MetadataRoute } from 'next'

import { absoluteUrl, isNoindexEnv } from '@/lib/site'

const DISALLOW = ['/admin', '/api/', '/next/', '/styleguide', '/en/styleguide', '/*?*preview=']

/** Cho phép Googlebot và các bot AI; chặn /admin, /api, preview (CLAUDE.md mục 9). Staging: chặn hết. */
export default function robots(): MetadataRoute.Robots {
  if (isNoindexEnv()) {
    return { rules: [{ userAgent: '*', disallow: '/' }] }
  }
  const allowBots = ['Googlebot', 'GPTBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended']
  return {
    rules: [
      ...allowBots.map((userAgent) => ({ userAgent, allow: '/', disallow: DISALLOW })),
      { userAgent: '*', allow: '/', disallow: DISALLOW },
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
  }
}
