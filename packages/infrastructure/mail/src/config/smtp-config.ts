import {z} from 'zod'

export const smtpConfigSchema = z.object({
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_USER: z.string().min(1).optional(),
  SMTP_PASS: z.string().min(1).optional(),
  SMTP_FROM: z.string().min(1),
  SMTP_SECURE: z.enum(['true', 'false']).optional(),
})

export type SmtpConfig = z.infer<typeof smtpConfigSchema>
