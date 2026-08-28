export async function loadWebLocaleNamespace(locale: string, namespace: string): Promise<Record<string, unknown>> {
  if (locale === 'en' && namespace === 'common') {
    return import('../assets/locales/en/common.json').then((module) => module.default)
  }

  if (locale === 'en' && namespace === 'tenancy') {
    return import('../assets/locales/en/tenancy.json').then((module) => module.default)
  }

  throw new Error(`Unknown locale namespace: ${locale}/${namespace}`)
}
