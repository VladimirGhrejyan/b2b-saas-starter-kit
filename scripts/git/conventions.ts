import {readFileSync} from 'node:fs'
import {dirname, join} from 'node:path'
import {fileURLToPath} from 'node:url'

import {GlobPattern} from './glob-pattern'
import type {ConventionsData} from './types'

/** Project commit/branch conventions loaded from config/conventions.json. */
export class Conventions {
  static readonly RELATIVE_CONFIG_PATH = 'config/conventions.json'

  readonly taskPrefix: string

  readonly types: string[]

  readonly exemptBranches: string[]

  private constructor(data: ConventionsData) {
    this.taskPrefix = data.taskPrefix
    this.types = data.types
    this.exemptBranches = data.exemptBranches
  }

  static workspaceRoot(): string {
    return join(dirname(fileURLToPath(import.meta.url)), '../..')
  }

  static load(rootDir: string = Conventions.workspaceRoot()): Conventions {
    const path = join(rootDir, Conventions.RELATIVE_CONFIG_PATH)
    const raw = JSON.parse(readFileSync(path, 'utf8')) as Partial<ConventionsData>

    if (typeof raw.taskPrefix !== 'string' || !/^[A-Z][A-Z0-9]*$/.test(raw.taskPrefix)) {
      throw new Error(
        `${Conventions.RELATIVE_CONFIG_PATH}: taskPrefix must be an uppercase alphanumeric prefix (e.g. "VC")`,
      )
    }

    if (!Array.isArray(raw.types) || raw.types.length === 0 || !raw.types.every((t) => typeof t === 'string')) {
      throw new Error(`${Conventions.RELATIVE_CONFIG_PATH}: types must be a non-empty string array`)
    }

    if (!Array.isArray(raw.exemptBranches) || !raw.exemptBranches.every((b) => typeof b === 'string')) {
      throw new Error(`${Conventions.RELATIVE_CONFIG_PATH}: exemptBranches must be a string array`)
    }

    return new Conventions({
      taskPrefix: raw.taskPrefix,
      types: raw.types,
      exemptBranches: raw.exemptBranches,
    })
  }

  get taskIdPattern(): RegExp {
    return new RegExp(`^${GlobPattern.escapeRegExp(this.taskPrefix)}-[0-9]+$`)
  }

  get branchPattern(): RegExp {
    const types = this.types.map(GlobPattern.escapeRegExp).join('|')
    const prefix = GlobPattern.escapeRegExp(this.taskPrefix)

    return new RegExp(`^(${types})/(${prefix}-[0-9]+)/([a-z0-9]+(?:-[a-z0-9]+)*)$`)
  }

  isExemptBranch(branch: string): boolean {
    return this.exemptBranches.some((pattern) => GlobPattern.toRegExp(pattern).test(branch))
  }

  isValidTaskId(scope: string): boolean {
    return this.taskIdPattern.test(scope)
  }

  exampleBranch(): string {
    return `feature/${this.taskPrefix}-1/add-x-functionality`
  }

  exampleCommit(): string {
    return `feature(${this.taskPrefix}-1): add x functionality`
  }
}
