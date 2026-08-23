import {z} from 'zod'

import {BrandedId} from '../brand/branded-id'

const PermissionNameSchema = z
  .string()
  .regex(
    /^[a-z][a-z0-9_-]*(\.[a-z][a-z0-9_-]*)+$/,
    'Permission must be a namespaced identifier (context.resource.action)',
  )

export const Permission = BrandedId.create('Permission', PermissionNameSchema)
export type Permission = z.infer<typeof Permission.schema>
