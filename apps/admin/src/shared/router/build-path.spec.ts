import {buildPath} from './build-path'
import {paths} from './paths'

describe('buildPath', () => {
  it('returns a static path unchanged', () => {
    expect(buildPath(paths.home)).toBe('/')
  })
})
