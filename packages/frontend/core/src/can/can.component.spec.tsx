import {render, screen} from '@testing-library/react'
import {Provider} from 'react-redux'

import {PermissionName} from '@b2b-saas-starter-kit/contracts'

import {setSession} from '../session/session.slice'
import {createTestStore} from '../testing/create-test-store'

import {Can} from './can.component'

describe('Can', () => {
  it('renders children when the session allows the permission', () => {
    const store = createTestStore()

    store.dispatch(
      setSession({
        userId: null,
        activeTenantId: null,
        effectivePermissions: [PermissionName.tenancyMembersRead],
      }),
    )

    render(
      <Provider store={store}>
        <Can permission={PermissionName.tenancyMembersRead}>allowed</Can>
      </Provider>,
    )

    expect(screen.getByText('allowed')).toBeTruthy()
  })

  it('renders nothing when the session denies the permission', () => {
    const store = createTestStore()

    render(
      <Provider store={store}>
        <Can permission={PermissionName.tenancyMembersRead}>secret</Can>
      </Provider>,
    )

    expect(screen.queryByText('secret')).toBeNull()
  })
})
