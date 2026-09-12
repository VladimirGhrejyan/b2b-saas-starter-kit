import {z} from 'zod'

export const forgotPasswordInputSchema = z
  .object({
    email: z.email(),
  })
  .meta({
    id: 'ForgotPasswordInput',
    description: 'Body for requesting a password-reset token',
  })

export type ForgotPasswordInput = z.infer<typeof forgotPasswordInputSchema>
