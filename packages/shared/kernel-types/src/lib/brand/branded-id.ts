import type {z} from 'zod'

/**
 * Factory for branded scalar identifiers shared by domain and contracts.
 *
 * The returned `schema` is a Zod brand; `parse` validates and returns the branded value.
 */
export class BrandedId {
  /**
   * Brands `schema` with `name` and returns `{name, schema, parse}`.
   *
   * @param name - Brand name (e.g. `'UserId'`). Distinct names are not assignable to each other.
   * @param schema - Base Zod schema (typically `z.uuid()` or a namespaced string).
   * @returns Branded schema plus a parse helper.
   */
  // TSchema is required so `schema.brand()` keeps the input schema type (not a wide ZodType).
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
  static create<const TName extends string, TSchema extends z.ZodType>(name: TName, schema: TSchema) {
    const branded = schema.brand(name)

    return {
      name,
      schema: branded,
      parse: (value: unknown): z.infer<typeof branded> => branded.parse(value) as z.infer<typeof branded>,
    }
  }
}
