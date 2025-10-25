interface RateLimitOptions {
  limit: number
  windowMs: number
}

export interface RateLimitResult {
  allowed: boolean
  retryAfterMs: number
  remaining: number
}

interface RateLimitWindow {
  count: number
  expiresAt: number
}

const globalStores = globalThis as typeof globalThis & {
  __rateLimitStore?: Map<string, RateLimitWindow>
}

const store = globalStores.__rateLimitStore ?? new Map<string, RateLimitWindow>()

if (!globalStores.__rateLimitStore) {
  globalStores.__rateLimitStore = store
}

export function enforceRateLimit(identifier: string, options: RateLimitOptions): RateLimitResult {
  const now = Date.now()
  const window = store.get(identifier)

  if (!window || window.expiresAt <= now) {
    store.set(identifier, { count: 1, expiresAt: now + options.windowMs })
    return { allowed: true, retryAfterMs: options.windowMs, remaining: options.limit - 1 }
  }

  if (window.count >= options.limit) {
    return { allowed: false, retryAfterMs: window.expiresAt - now, remaining: 0 }
  }

  window.count += 1
  store.set(identifier, window)

  return { allowed: true, retryAfterMs: window.expiresAt - now, remaining: options.limit - window.count }
}
