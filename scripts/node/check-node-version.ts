import {existsSync, readdirSync, readFileSync} from 'node:fs'
import {join} from 'node:path'

type SemVer = readonly [number, number, number]

/**
 * Guards that the Node.js version is declared consistently across:
 *  - `.nvmrc`                      — developer + CI runtime (exact x.y.z)
 *  - `package.json` engines.node   — install-time policy (single LTS major range)
 *  - `infra/docker/*.Dockerfile`   — image build arg `ARG NODE_VERSION=…`
 *
 * Dockerfiles are optional (they arrive with the first app); that check is
 * skipped when `infra/docker` is absent. Exits non-zero on any mismatch so it
 * can run from Husky/lint-staged and CI. Extra CLI args (staged file paths
 * passed by lint-staged) are ignored — the check always reads the fixed paths.
 */
class NodeVersionCheck {
  private static readonly DOCKER_DIR = 'infra/docker'

  private static readonly EXACT_SEMVER = /^\d+\.\d+\.\d+$/

  static run(): void {
    const errors: string[] = []
    const nvmrc = NodeVersionCheck.readNvmrc(errors)

    if (nvmrc) {
      NodeVersionCheck.checkEngines(nvmrc, errors)
      NodeVersionCheck.checkDockerfiles(nvmrc, errors)
    }

    if (errors.length > 0) {
      console.error('Node version consistency check failed:')
      for (const error of errors) {
        console.error(`  - ${error}`)
      }
      console.error(
        '\nKeep .nvmrc, package.json "engines.node", and Dockerfile ARG NODE_VERSION in sync (Node LTS only).',
      )
      process.exit(1)
    }

    console.log(`Node version consistent: ${nvmrc}`)
  }

  private static readNvmrc(errors: string[]): string | null {
    let raw: string

    try {
      raw = readFileSync('.nvmrc', 'utf8').trim()
    } catch {
      errors.push('.nvmrc is missing or unreadable')

      return null
    }

    if (!NodeVersionCheck.EXACT_SEMVER.test(raw)) {
      errors.push(`.nvmrc must contain an exact x.y.z version (got "${raw}")`)

      return null
    }

    return raw
  }

  private static checkEngines(nvmrc: string, errors: string[]): void {
    let engines: string | undefined

    try {
      const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as {engines?: {node?: string}}

      engines = pkg.engines?.node
    } catch {
      errors.push('package.json is missing or unreadable')

      return
    }

    if (!engines) {
      errors.push('package.json "engines.node" is not set')

      return
    }

    const lower = engines.match(/>=\s*(\d+\.\d+\.\d+)/)
    const upper = engines.match(/<\s*(\d+\.\d+\.\d+)/)

    if (!lower || !upper) {
      errors.push(`package.json "engines.node" ("${engines}") must be a ">=x.y.z <a.b.c" LTS range`)

      return
    }

    const nvmrcSem = NodeVersionCheck.parse(nvmrc)
    const lowerSem = NodeVersionCheck.parse(lower[1])
    const upperSem = NodeVersionCheck.parse(upper[1])

    if (lowerSem[0] !== nvmrcSem[0]) {
      errors.push(`engines lower-bound major (${lowerSem[0]}) != .nvmrc major (${nvmrcSem[0]})`)
    }

    if (upperSem[0] !== nvmrcSem[0] + 1) {
      errors.push(`engines upper bound should be <${nvmrcSem[0] + 1}.0.0 to pin a single major (got <${upper[1]})`)
    }

    if (NodeVersionCheck.compare(nvmrcSem, lowerSem) < 0) {
      errors.push(`.nvmrc (${nvmrc}) is below engines minimum (${lower[1]})`)
    }
  }

  private static checkDockerfiles(nvmrc: string, errors: string[]): void {
    if (!existsSync(NodeVersionCheck.DOCKER_DIR)) {
      return
    }

    const dockerfiles = readdirSync(NodeVersionCheck.DOCKER_DIR).filter(
      (name) => name.endsWith('.Dockerfile') || name === 'Dockerfile',
    )

    for (const name of dockerfiles) {
      const path = join(NodeVersionCheck.DOCKER_DIR, name)
      const match = readFileSync(path, 'utf8').match(/ARG\s+NODE_VERSION=(\S+)/)

      if (match && match[1] !== nvmrc) {
        errors.push(`${path}: ARG NODE_VERSION=${match[1]} != .nvmrc ${nvmrc}`)
      }
    }
  }

  private static parse(version: string): SemVer {
    const [major, minor, patch] = version.split('.').map(Number)

    return [major, minor, patch]
  }

  private static compare(a: SemVer, b: SemVer): number {
    for (let i = 0; i < 3; i++) {
      if (a[i] !== b[i]) {
        return a[i] - b[i]
      }
    }

    return 0
  }
}

NodeVersionCheck.run()
