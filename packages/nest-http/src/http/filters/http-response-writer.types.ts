export type HttpResponseWriter = {
  status: (statusCode: number) => {json: (body: unknown) => void}
}
