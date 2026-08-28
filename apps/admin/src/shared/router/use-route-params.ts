import {useParams} from 'react-router'
import type {ZodType} from 'zod'

export function useRouteParams<T>(schema: ZodType<T>): T {
  const params = useParams()

  return schema.parse(params)
}
