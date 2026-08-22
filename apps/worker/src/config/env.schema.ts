import {z} from 'zod'

/** Env-driven bootstrap contract for the worker process. */
export const WorkerEnvSchema = z.object({
  APP_TYPE: z.literal('worker').default('worker'),
})

export type WorkerEnv = z.infer<typeof WorkerEnvSchema>
