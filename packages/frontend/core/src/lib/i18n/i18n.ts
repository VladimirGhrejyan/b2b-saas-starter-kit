import type {i18n as I18nInstance} from 'i18next'
import {createInstance} from 'i18next'
import {initReactI18next} from 'react-i18next'

import {TypeScriptUtils} from '@b2b-saas-starter-kit/utils'

import type {CreateI18nOptions, LocaleResource} from './i18n.types'

export class I18n {
  static readonly localeStorageKey = 'i18n:locale'

  static async create(options: CreateI18nOptions): Promise<I18nInstance> {
    const storageKey = options.storageKey ?? I18n.localeStorageKey
    const storedLocale = options.storage.get(storageKey)
    let locale = options.defaultLocale

    if (!TypeScriptUtils.isNil(storedLocale) && !TypeScriptUtils.isEmpty(storedLocale)) {
      locale = storedLocale
    }

    const resources: Record<string, Record<string, LocaleResource>> = {[locale]: {}}

    for (const namespace of options.namespaces) {
      resources[locale][namespace] = await options.loadNamespace(locale, namespace)
    }

    const instance = createInstance()

    await instance.use(initReactI18next).init({
      lng: locale,
      fallbackLng: options.defaultLocale,
      defaultNS: options.namespaces[0],
      ns: options.namespaces,
      resources,
      interpolation: {escapeValue: false},
    })

    instance.on('languageChanged', (language) => {
      options.storage.set(storageKey, language)
    })

    options.storage.set(storageKey, instance.language)

    return instance
  }
}
