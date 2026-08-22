import type {ZodError} from 'zod'

/** Thrown when loaded config fails Zod validation. */
export class ConfigValidationError extends Error {
  readonly issues: ZodError['issues']

  constructor(zodError: ZodError) {
    const details = zodError.issues
      .map((issue) => {
        const path = issue.path.length > 0 ? issue.path.join('.') : '(root)'

        return `  - ${path}: ${issue.message}`
      })
      .join('\n')

    super(`Invalid config:\n${details}`)
    this.name = 'ConfigValidationError'
    this.issues = zodError.issues
  }
}
