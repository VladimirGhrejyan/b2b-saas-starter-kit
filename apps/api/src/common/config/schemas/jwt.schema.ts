import {z} from 'zod'

import {
  DEV_JWT_ACCESS_SECRET,
  JWT_ACCESS_TTL_SECONDS,
  JWT_AUDIENCE,
  JWT_ISSUER,
} from '../../auth/jwt/jwt-access.constants'

export const jwtSchema = z.object({
  accessSecret: z.string().min(1).default(DEV_JWT_ACCESS_SECRET),
  ttlSeconds: z.number().int().positive().default(JWT_ACCESS_TTL_SECONDS),
  issuer: z.string().min(1).default(JWT_ISSUER),
  audience: z.string().min(1).default(JWT_AUDIENCE),
})
