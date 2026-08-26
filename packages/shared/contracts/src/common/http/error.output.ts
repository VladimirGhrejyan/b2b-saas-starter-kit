import {z} from 'zod'

export const errorOutputSchema = z
  .object({
    code: z.string().min(1),
    message: z.string().min(1),
    details: z.unknown().optional(),
  })
  .meta({
    id: 'ErrorOutput',
    description: 'Shared API error envelope',
  })

export type ErrorOutput = z.infer<typeof errorOutputSchema>
