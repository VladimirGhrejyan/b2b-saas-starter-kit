import {z} from 'zod'

export const registerUserInputSchema = z
  .object({
    email: z.email(),
    displayName: z.string().trim().min(1),
    password: z.string().min(8),
  })
  .meta({
    id: 'RegisterUserInput',
    description: 'Body for registering a user with a local password',
  })

export type RegisterUserInput = z.infer<typeof registerUserInputSchema>
