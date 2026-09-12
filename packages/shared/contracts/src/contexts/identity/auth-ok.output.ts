import {z} from 'zod'

export const authOkOutputSchema = z
  .object({
    ok: z.literal(true),
  })
  .meta({
    id: 'AuthOkOutput',
    description: 'Empty success payload for auth side effects',
  })

export type AuthOkOutput = z.infer<typeof authOkOutputSchema>
