import {useTranslation} from 'react-i18next'
import {Navigate} from 'react-router'

import {TypeScriptUtils} from '@b2b-saas-starter-kit/utils'
import {SessionSelectors, useAppSelector} from '@b2b-saas-starter-kit/frontend-core'

import {LoginForm} from '@/features/auth'
import {paths} from '@/shared/router'

export function LoginPage() {
  const {t} = useTranslation('auth')
  const accessToken = useAppSelector(SessionSelectors.accessToken)

  if (!TypeScriptUtils.isNil(accessToken)) {
    return <Navigate to={paths.home} replace />
  }

  return (
    <section>
      <h1>{t('title')}</h1>
      <LoginForm />
    </section>
  )
}
