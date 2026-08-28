import {useState} from 'react'

import {useTranslation} from 'react-i18next'

import {TenantId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'
import {Button} from '@b2b-saas-starter-kit/ui-kit'
import {setSession, useAppDispatch} from '@b2b-saas-starter-kit/frontend-core'

import {environment} from '@/shared/environment'

export function DevPrincipalPicker() {
  const {t} = useTranslation('common')
  const dispatch = useAppDispatch()
  const [userId, setUserId] = useState('')
  const [tenantId, setTenantId] = useState('')
  const [invalid, setInvalid] = useState(false)

  if (environment.appEnv !== 'development') {
    return null
  }

  const apply = () => {
    const parsedUserId = UserId.schema.safeParse(userId)
    const parsedTenantId = TenantId.schema.safeParse(tenantId)

    if (!parsedUserId.success || !parsedTenantId.success) {
      setInvalid(true)

      return
    }

    setInvalid(false)
    dispatch(
      setSession({
        userId: parsedUserId.data,
        activeTenantId: parsedTenantId.data,
        effectivePermissions: [],
      }),
    )
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        apply()
      }}
    >
      <fieldset>
        <legend>{t('principalTitle')}</legend>
        <label htmlFor="dev-principal-user-id">{t('principalUserId')}</label>
        <input
          id="dev-principal-user-id"
          value={userId}
          onChange={(event) => {
            setUserId(event.target.value)
          }}
        />
        <label htmlFor="dev-principal-tenant-id">{t('principalTenantId')}</label>
        <input
          id="dev-principal-tenant-id"
          value={tenantId}
          onChange={(event) => {
            setTenantId(event.target.value)
          }}
        />
        <Button type="submit">{t('principalApply')}</Button>
        {invalid ? <p>{t('principalInvalid')}</p> : null}
      </fieldset>
    </form>
  )
}
