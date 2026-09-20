export class ApiKeyToken {
  static readonly wirePrefix = 'bsk_'

  static readonly publicPrefixLength = 12

  static isApiKeyToken(token: string): boolean {
    return token.startsWith(ApiKeyToken.wirePrefix)
  }

  static create(publicPrefix: string, secret: string): string {
    return `${ApiKeyToken.wirePrefix}${publicPrefix}_${secret}`
  }

  static displayPrefix(publicPrefix: string): string {
    return `${ApiKeyToken.wirePrefix}${publicPrefix}`
  }

  static parse(token: string): {readonly prefix: string} | undefined {
    const match = /^bsk_([a-z0-9]{12})_.+$/i.exec(token)

    if (match?.[1] === undefined) {
      return undefined
    }

    return {prefix: ApiKeyToken.displayPrefix(match[1].toLowerCase())}
  }

  static compactId(rawId: string): string {
    return rawId.replaceAll('-', '').slice(0, ApiKeyToken.publicPrefixLength)
  }
}
