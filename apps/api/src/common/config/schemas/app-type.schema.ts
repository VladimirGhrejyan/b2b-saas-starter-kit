import {z} from 'zod'

export const appTypeSchema = z.literal('api').default('api')
