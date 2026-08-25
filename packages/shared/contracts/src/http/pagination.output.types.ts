export type PaginatedOutput<T> = {
  items: T[]
  page: number
  pageSize: number
  total: number
}
