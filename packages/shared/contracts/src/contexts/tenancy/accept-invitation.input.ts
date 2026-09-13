import {z} from 'zod'

export const acceptInvitationInputSchema = z
  .object({
    token: z.string().min(1),
    displayName: z.string().trim().min(1).optional(),
    password: z.string().min(8).optional(),
  })
  .meta({
    id: 'AcceptInvitationInput',
    description: 'Body for accepting an invitation. New users must send displayName and password.',
  })

export type AcceptInvitationInput = z.infer<typeof acceptInvitationInputSchema>
