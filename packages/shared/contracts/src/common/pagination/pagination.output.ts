import {z} from 'zod'

export function paginatedOutputSchema<T extends z.ZodType>(
  itemSchema: T,
  meta: {id: string; title?: string; description?: string},
) {
  return z
    .object({
      items: z.array(itemSchema),
      page: z.number().int().positive(),
      pageSize: z.number().int().positive(),
      total: z.number().int().nonnegative(),
    })
    .meta({
      id: meta.id,
      description: meta.description ?? 'Paginated list of items',
      ...(meta.title === undefined ? {} : {title: meta.title}),
    })
}
