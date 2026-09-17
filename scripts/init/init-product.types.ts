export type KitIdentity = {
  scope: string
  slug: string
  shortSlug: string
  displayName: string
  displayShort: string
  adminTitle: string
  taskPrefix: string
  apiAudience: string
  httpUserAgent: string
}

export type InitProductOptions = {
  scope: string
  displayName: string
  slug: string
  shortSlug: string
  taskPrefix: string
  adminTitle: string
  apiAudience: string
  httpUserAgent: string
  postgresAppName: string
  jwtIssuer: string
  dryRun: boolean
  yes: boolean
  skipDocs: boolean
  install: boolean
}

export type TextReplacement = readonly [from: string, to: string]

/** Current kit identity — replaced by {@link InitProductParser} with product-specific values. */
export const KIT_IDENTITY: KitIdentity = {
  scope: '@b2b-saas-starter-kit',
  slug: 'b2b-saas-starter-kit',
  shortSlug: 'b2b-saas',
  displayName: 'B2B SaaS Starter Kit',
  displayShort: 'B2B SaaS Starter',
  adminTitle: 'B2B SaaS Admin',
  taskPrefix: 'VC',
  apiAudience: 'b2b-saas-api',
  httpUserAgent: 'b2b-saas-http-client',
}
