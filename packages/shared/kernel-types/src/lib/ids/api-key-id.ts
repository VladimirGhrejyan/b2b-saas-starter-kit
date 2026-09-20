import {z} from 'zod'

import {BrandedId} from '../brand/branded-id'

export const ApiKeyId = BrandedId.create('ApiKeyId', z.uuid())
export type ApiKeyId = z.infer<typeof ApiKeyId.schema>
