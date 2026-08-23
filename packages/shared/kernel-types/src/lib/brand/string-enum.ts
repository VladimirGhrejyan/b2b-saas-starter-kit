import {z} from 'zod'

/**
 * Factory for cross-cutting string enums that appear in both domain and wire contracts.
 */
export class StringEnum {
  /**
   * Builds a Zod enum plus the original value tuple and a parse helper.
   *
   * @param values - Non-empty tuple of allowed string literals.
   * @returns `{values, schema, parse}`.
   */
  static create<const TValues extends readonly [string, ...string[]]>(values: TValues) {
    const schema = z.enum(values)

    return {
      values,
      schema,
      parse: (value: unknown): z.infer<typeof schema> => schema.parse(value),
    }
  }
}
