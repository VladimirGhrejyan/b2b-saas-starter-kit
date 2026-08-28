import {useTranslation} from 'react-i18next'

import {TypeScriptUtils} from '@b2b-saas-starter-kit/utils'
import {SessionSelectors, useAppSelector} from '@b2b-saas-starter-kit/frontend-core'

import {getMeQuery, TenantSwitcher, useGetMeQuery} from '@/features/me'
import {isErrorOutput} from '@/shared/api/is-error-output'

export function MePage() {
  const {t} = useTranslation('tenancy')
  const userId = useAppSelector(SessionSelectors.userId)
  const tenantId = useAppSelector(SessionSelectors.activeTenantId)
  const meQuery = getMeQuery(userId, tenantId)
  const {data, error} = useGetMeQuery(meQuery.arg, {skip: meQuery.skip})

  return (
    <section>
      <h1>{t('meTitle')}</h1>
      <TenantSwitcher />
      {isErrorOutput(error) ? (
        <p>
          {error.code}: {error.message}
        </p>
      ) : null}
      {data ? (
        <div>
          <p>
            {t('meEmail')}: {data.user.email}
          </p>
          <p>
            {t('meDisplayName')}: {data.user.displayName}
          </p>
          {TypeScriptUtils.isNil(data.membership) ? <p>{t('meNoMembership')}</p> : null}
          <h2>{t('mePermissions')}</h2>
          <ul>
            {data.effectivePermissions.map((permission) => (
              <li key={permission}>{permission}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  )
}
