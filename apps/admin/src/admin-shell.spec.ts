import {existsSync, readFileSync} from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

const srcDir = path.dirname(fileURLToPath(import.meta.url))
const appRoot = path.resolve(srcDir, '..')

describe('admin audience shell', () => {
  it('does not copy product features from web', () => {
    expect(existsSync(path.join(srcDir, 'features/members'))).toBe(false)
    expect(existsSync(path.join(srcDir, 'features/me'))).toBe(false)
    expect(existsSync(path.join(srcDir, 'features/dev-principal'))).toBe(false)
  })

  it('is tagged as a frontend app and does not depend on web', () => {
    const pkg = JSON.parse(readFileSync(path.join(appRoot, 'package.json'), 'utf8')) as {
      dependencies: Record<string, string>
      nx: {tags: string[]; implicitDependencies?: string[]}
    }

    expect(pkg.nx.tags).toEqual(['scope:frontend', 'type:app'])
    expect(pkg.nx.implicitDependencies).toBeUndefined()
    expect(pkg.dependencies['@b2b-saas-starter-kit/web']).toBeUndefined()
  })
})
