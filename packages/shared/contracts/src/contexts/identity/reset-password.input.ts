import {z} from 'zod'

export const resetPasswordInputSchema = z
  .object({
    token: z.string().min(1),
    password: z.string().min(8),
  })
  .meta({
    id: 'ResetPasswordInput',
    description: 'Body for consuming a password-reset token',
  })

export type ResetPasswordInput = z.infer<typeof resetPasswordInputSchema>
