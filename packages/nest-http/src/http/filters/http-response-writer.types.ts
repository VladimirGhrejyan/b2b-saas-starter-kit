export type HttpResponseWriter = {
  setHeader: (name: string, value: string) => void
  status: (statusCode: number) => {json: (body: unknown) => void}
}
