import {buildPath} from './build-path'
import {paths} from './paths'

describe('buildPath', () => {
  it('returns a static path unchanged', () => {
    expect(buildPath(paths.home)).toBe('/')
  })

  it('substitutes named params', () => {
    expect(buildPath(paths.members, {tenantId: 'abc'})).toBe('/tenants/abc/members')
  })

  it('throws when a param is missing', () => {
    expect(() => buildPath(paths.members)).toThrow('Missing path param "tenantId"')
  })
})
