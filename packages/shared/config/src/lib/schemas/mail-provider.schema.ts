import {z} from 'zod'

export const smtpMailProviderSchema = z.object({
  transport: z.literal('smtp'),
  from: z.string().min(1),
  host: z.string().min(1),
  port: z.number().int().positive().default(587),
  user: z.string().min(1).optional(),
  pass: z.string().min(1).optional(),
  secure: z.boolean().default(false),
})

export const httpMailProviderSchema = z.object({
  transport: z.literal('http'),
  from: z.string().min(1),
  url: z.url(),
  apiKey: z.string().min(1).optional(),
})

export const mailProviderSchema = z.discriminatedUnion('transport', [smtpMailProviderSchema, httpMailProviderSchema])

export type SmtpMailProvider = z.infer<typeof smtpMailProviderSchema>
export type HttpMailProvider = z.infer<typeof httpMailProviderSchema>
export type MailProvider = z.infer<typeof mailProviderSchema>
