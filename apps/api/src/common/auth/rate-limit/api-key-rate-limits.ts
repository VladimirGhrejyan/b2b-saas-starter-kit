import type {RateLimitOptions} from './rate-limit.types'

export const ApiKeyRateLimits = {
  create: {bucket: 'api-keys-create', limit: 10, windowSeconds: 900},
  list: {bucket: 'api-keys-list', limit: 60, windowSeconds: 60},
  revoke: {bucket: 'api-keys-revoke', limit: 30, windowSeconds: 60},
} as const satisfies Record<string, RateLimitOptions>
