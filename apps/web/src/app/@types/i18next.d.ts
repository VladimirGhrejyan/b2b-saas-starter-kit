import type auth from '@/shared/assets/locales/en/auth.json'
import type common from '@/shared/assets/locales/en/common.json'
import type tenancy from '@/shared/assets/locales/en/tenancy.json'

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common'
    resources: {
      auth: typeof auth
      common: typeof common
      tenancy: typeof tenancy
    }
  }
}
