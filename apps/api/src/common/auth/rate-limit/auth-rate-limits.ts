import type {RateLimitOptions} from './rate-limit.types'

export const AuthRateLimits = {
  login: {bucket: 'login', limit: 10, windowSeconds: 900},
  register: {bucket: 'register', limit: 5, windowSeconds: 900},
  forgotPassword: {bucket: 'forgot', limit: 5, windowSeconds: 900},
  resetPassword: {bucket: 'reset', limit: 10, windowSeconds: 900},
  refresh: {bucket: 'refresh', limit: 60, windowSeconds: 60},
  logout: {bucket: 'logout', limit: 30, windowSeconds: 60},
} as const satisfies Record<string, RateLimitOptions>
