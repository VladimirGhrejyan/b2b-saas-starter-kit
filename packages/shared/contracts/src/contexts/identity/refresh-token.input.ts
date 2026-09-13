import {z} from 'zod'

export const refreshTokenInputSchema = z
  .object({
    refreshToken: z.string().min(1),
  })
  .meta({
    id: 'RefreshTokenInput',
    description: 'Opaque refresh token for native rotate and logout',
  })

export type RefreshTokenInput = z.infer<typeof refreshTokenInputSchema>
