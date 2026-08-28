import {InMemoryStorage} from '../../adapters/web/in-memory-storage'

import {I18n} from './i18n'

describe('I18n', () => {
  it('persists the default locale through StoragePort', async () => {
    const storage = new InMemoryStorage()
    const i18n = await I18n.create({
      defaultLocale: 'en',
      storage,
      namespaces: ['common'],
      loadNamespace: async () => ({title: 'Home'}),
    })

    expect(i18n.language).toBe('en')
    expect(storage.get(I18n.localeStorageKey)).toBe('en')
    expect(i18n.t('title', {ns: 'common'})).toBe('Home')
  })

  it('reads a stored locale and persists language changes', async () => {
    const storage = new InMemoryStorage()

    storage.set(I18n.localeStorageKey, 'en')

    const i18n = await I18n.create({
      defaultLocale: 'en',
      storage,
      namespaces: ['common'],
      loadNamespace: async () => ({title: 'Home'}),
    })

    i18n.addResourceBundle('fr', 'common', {title: 'Accueil'})
    await i18n.changeLanguage('fr')

    expect(storage.get(I18n.localeStorageKey)).toBe('fr')
    expect(i18n.t('title', {ns: 'common'})).toBe('Accueil')
  })
})
