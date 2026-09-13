export type ClientIpRequest = {
  readonly ip?: string
  readonly socket?: {
    readonly remoteAddress?: string
  }
}
