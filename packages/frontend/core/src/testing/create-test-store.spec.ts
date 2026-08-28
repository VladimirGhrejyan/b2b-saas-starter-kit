import {SessionSelectors} from '../session/session.selectors'

import {createTestStore} from './create-test-store'

describe('createTestStore', () => {
  it('returns a store with session state', () => {
    const store = createTestStore()

    expect(SessionSelectors.state(store.getState())).toEqual({
      userId: null,
      activeTenantId: null,
      effectivePermissions: [],
    })
  })
})
