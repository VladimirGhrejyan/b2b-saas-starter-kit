import {useState} from 'react'

import {useTranslation} from 'react-i18next'

import {TenantId} from '@b2b-saas-starter-kit/shared-kernel-types'
import {Button} from '@b2b-saas-starter-kit/ui-kit'
import {SessionSelectors, setSession, useAppDispatch, useAppSelector} from '@b2b-saas-starter-kit/frontend-core'

import {meApi} from '../api/me-api'

export function TenantSwitcher() {
  const {t} = useTranslation('tenancy')
  const dispatch = useAppDispatch()
  const session = useAppSelector(SessionSelectors.state)
  const [tenantId, setTenantId] = useState(session.activeTenantId ?? '')

  const apply = () => {
    const parsed = TenantId.schema.safeParse(tenantId)

    if (!parsed.success) {
      return
    }

    dispatch(
      setSession({
        userId: session.userId,
        activeTenantId: parsed.data,
        effectivePermissions: [],
      }),
    )
    dispatch(meApi.util.invalidateTags(['Me', 'Membership']))
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        apply()
      }}
    >
      <label htmlFor="active-tenant-id">{t('switchTenant')}</label>
      <input
        id="active-tenant-id"
        value={tenantId}
        onChange={(event) => {
          setTenantId(event.target.value)
        }}
      />
      <Button type="submit">{t('switchTenantApply')}</Button>
    </form>
  )
}
