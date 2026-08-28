import {useTranslation} from 'react-i18next'
import {Link} from 'react-router'

import {PermissionName} from '@b2b-saas-starter-kit/contracts'
import type {TenantId} from '@b2b-saas-starter-kit/shared-kernel-types'
import {TypeScriptUtils} from '@b2b-saas-starter-kit/utils'
import {Can} from '@b2b-saas-starter-kit/frontend-core'

import {buildPath, paths} from '@/shared/router'

export function AppNav({tenantId}: {tenantId: TenantId | null}) {
  const {t} = useTranslation('common')

  return (
    <nav>
      <Link to={paths.home}>{t('navHome')}</Link>
      <Link to={paths.me}>{t('navMe')}</Link>
      <Can permission={PermissionName.tenancyMembersRead}>
        {TypeScriptUtils.isNil(tenantId) ? (
          <span>{t('navMembers')}</span>
        ) : (
          <Link to={buildPath(paths.members, {tenantId})}>{t('navMembers')}</Link>
        )}
      </Can>
    </nav>
  )
}
