import {type ErrorOutput, errorOutputSchema} from '@b2b-saas-starter-kit/contracts'

export function isErrorOutput(error: unknown): error is ErrorOutput {
  return errorOutputSchema.safeParse(error).success
}
