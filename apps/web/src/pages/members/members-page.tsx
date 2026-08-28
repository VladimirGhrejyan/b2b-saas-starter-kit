import {useTranslation} from 'react-i18next'

import {PermissionName, tenantIdParamSchema} from '@b2b-saas-starter-kit/contracts'
import {useCan} from '@b2b-saas-starter-kit/frontend-core'

import {useListMembersQuery} from '@/features/members'
import {isErrorOutput} from '@/shared/api/is-error-output'
import {useRouteParams} from '@/shared/router'

export function MembersPage() {
  const {t} = useTranslation('tenancy')
  const {tenantId} = useRouteParams(tenantIdParamSchema)
  const canRead = useCan(PermissionName.tenancyMembersRead)
  const {data, error} = useListMembersQuery(tenantId)

  return (
    <section>
      <h1>{t('membersTitle')}</h1>
      {isErrorOutput(error) ? (
        <p>
          {error.code}: {error.message}
        </p>
      ) : null}
      {canRead && data ? (
        data.members.length === 0 ? (
          <p>{t('membersEmpty')}</p>
        ) : (
          <ul>
            {data.members.map((member) => (
              <li key={member.membershipId}>
                {member.userId} {member.status}
              </li>
            ))}
          </ul>
        )
      ) : null}
    </section>
  )
}
