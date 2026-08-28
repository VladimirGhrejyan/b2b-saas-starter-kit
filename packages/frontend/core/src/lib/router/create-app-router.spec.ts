import {createAppRouter} from './create-app-router'

describe('createAppRouter', () => {
  it('returns a browser-history router', () => {
    const router = createAppRouter({
      history: 'browser',
      routes: [{path: '/', element: null}],
    })

    expect(router).toBeDefined()
    expect(router.routes).toHaveLength(1)
  })

  it('returns a hash-history router', () => {
    const router = createAppRouter({
      history: 'hash',
      routes: [{path: '/', element: null}],
    })

    expect(router).toBeDefined()
    expect(router.routes).toHaveLength(1)
  })
})
