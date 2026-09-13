import {z} from 'zod'

export const setOrChangePasswordInputSchema = z
  .object({
    password: z.string().min(8),
    currentPassword: z.string().min(1).optional(),
  })
  .meta({
    id: 'SetOrChangePasswordInput',
    description: 'Set a missing local password or change one with the current password',
  })

export type SetOrChangePasswordInput = z.infer<typeof setOrChangePasswordInputSchema>
