import {z} from 'zod'

export const createUserInputSchema = z
  .object({
    email: z.email(),
    displayName: z.string().trim().min(1),
  })
  .meta({
    id: 'CreateUserInput',
    description: 'Body for creating a user',
  })

export type CreateUserInput = z.infer<typeof createUserInputSchema>
