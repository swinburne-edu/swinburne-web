export function getSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')
}

export function absoluteUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path
  return `${getSiteUrl()}${path.startsWith('/') ? '' : '/'}${path}`
}

export function isNoindexEnv(): boolean {
  return process.env.NOINDEX === 'true'
}

export function isExternalUrl(url: string): boolean {
  return /^https?:\/\//i.test(url) && !url.startsWith(getSiteUrl())
}
