import {z} from 'zod'

export const logoutTokenInputSchema = z
  .object({
    refreshToken: z.string().min(1).optional(),
  })
  .meta({
    id: 'LogoutTokenInput',
    description: 'Optional refresh token for native logout',
  })

export type LogoutTokenInput = z.infer<typeof logoutTokenInputSchema>
