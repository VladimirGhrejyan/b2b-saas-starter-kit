import {z} from 'zod'

export const loginInputSchema = z
  .object({
    email: z.email(),
    password: z.string().min(1),
  })
  .meta({
    id: 'LoginInput',
    description: 'Body for email and password login',
  })

export type LoginInput = z.infer<typeof loginInputSchema>
