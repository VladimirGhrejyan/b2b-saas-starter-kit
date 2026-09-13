import {z} from 'zod'

import {authSessionOutputSchema} from './auth-session.output'

export const authTokenSessionOutputSchema = authSessionOutputSchema
  .extend({
    refreshToken: z.string().min(1),
  })
  .meta({
    id: 'AuthTokenSessionOutput',
    description: 'Access token plus opaque refresh token for non-browser clients',
  })

export type AuthTokenSessionOutput = z.infer<typeof authTokenSessionOutputSchema>
