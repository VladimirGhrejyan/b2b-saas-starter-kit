import {buildPath} from './build-path'
import {paths} from './paths'

describe('buildPath', () => {
  it('returns a static path unchanged', () => {
    expect(buildPath(paths.home)).toBe('/')
  })

  it('substitutes named params', () => {
    expect(buildPath(paths.demoItem, {id: 'abc'})).toBe('/demo/abc')
  })

  it('throws when a param is missing', () => {
    expect(() => buildPath(paths.demoItem)).toThrow('Missing path param "id"')
  })
})
