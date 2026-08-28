import {existsSync, readFileSync} from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

const srcDir = path.dirname(fileURLToPath(import.meta.url))
const appRoot = path.resolve(srcDir, '..')

describe('mobile host shell', () => {
  it('does not contain a product features folder', () => {
    expect(existsSync(path.join(srcDir, 'features'))).toBe(false)
  })

  it('is tagged as a frontend app and implicitly depends on web', () => {
    const pkg = JSON.parse(readFileSync(path.join(appRoot, 'package.json'), 'utf8')) as {
      nx: {tags: string[]; implicitDependencies: string[]}
    }

    expect(pkg.nx.tags).toEqual(['scope:frontend', 'type:app'])
    expect(pkg.nx.implicitDependencies).toEqual(['web'])
  })
})
