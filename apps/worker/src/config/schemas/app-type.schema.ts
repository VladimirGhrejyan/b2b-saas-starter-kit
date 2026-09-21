import {z} from 'zod'

export const appTypeSchema = z.literal('worker').default('worker')
