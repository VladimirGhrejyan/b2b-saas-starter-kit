import {z} from 'zod'

export const errorOutputSchema = z.object({
  code: z.string().min(1),
  message: z.string().min(1),
  details: z.unknown().optional(),
})

export type ErrorOutput = z.infer<typeof errorOutputSchema>
