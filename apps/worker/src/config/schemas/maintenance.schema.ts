import {z} from 'zod'

export const maintenanceSchema = z.object({
  refreshSessionsEveryMs: z.number().int().positive().default(3_600_000),
  passwordResetTokensEveryMs: z.number().int().positive().default(86_400_000),
  staleInvitationsEveryMs: z.number().int().positive().default(86_400_000),
  reclaimStaleOutboxEveryMs: z.number().int().positive().default(60_000),
})
