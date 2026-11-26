/**
 * Xác minh Cloudflare Turnstile phía server.
 * Local/dev không cấu hình key → dùng test key luôn-pass của Cloudflare.
 * https://developers.cloudflare.com/turnstile/troubleshooting/testing/
 */
export const TURNSTILE_TEST_SITE_KEY = '1x00000000000000000000AA'
export const TURNSTILE_TEST_SECRET = '1x0000000000000000000000000000000AA'

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

export type TurnstileResult = { success: boolean; errors: string[] }

export type TurnstileVerifier = (
  token: string | undefined,
  ip?: string | null,
) => Promise<TurnstileResult>

export function resolveTurnstileSiteKey(
  settingsKey?: string | null,
  env: NodeJS.ProcessEnv = process.env,
): string {
  return (
    settingsKey?.trim() ||
    env.TURNSTILE_SITE_KEY?.trim() ||
    (env.NODE_ENV === 'production' ? '' : TURNSTILE_TEST_SITE_KEY)
  )
}

export function resolveTurnstileSecret(env: NodeJS.ProcessEnv = process.env): string | null {
  const secret = env.TURNSTILE_SECRET_KEY?.trim()
  if (secret) return secret
  return env.NODE_ENV === 'production' ? null : TURNSTILE_TEST_SECRET
}

export function createTurnstileVerifier(
  secret: string | null,
  fetchImpl: typeof fetch = fetch,
): TurnstileVerifier {
  return async (token, ip) => {
    if (!secret) return { success: false, errors: ['missing-secret'] }
    if (!token) return { success: false, errors: ['missing-input-response'] }
    const body = new URLSearchParams({ secret, response: token })
    if (ip) body.set('remoteip', ip)
    try {
      const res = await fetchImpl(VERIFY_URL, {
        method: 'POST',
        body,
        signal: AbortSignal.timeout(5000),
      })
      const json = (await res.json()) as { success?: boolean; 'error-codes'?: string[] }
      return { success: json.success === true, errors: json['error-codes'] ?? [] }
    } catch (err) {
      return { success: false, errors: [err instanceof Error ? err.message : 'verify-failed'] }
    }
  }
}
