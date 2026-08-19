import {execFileSync} from 'node:child_process'

import type {Conventions} from './conventions'
import type {ParsedBranch} from './types'

/** Current git branch helpers and branch-name parsing. */
export class GitBranch {
  static current(): string | null {
    try {
      const name = execFileSync('git', ['branch', '--show-current'], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim()

      return name.length > 0 ? name : null
    } catch {
      return null
    }
  }

  static parse(branch: string, conventions: Conventions): ParsedBranch | null {
    const match = conventions.branchPattern.exec(branch)

    if (!match) {
      return null
    }

    return {
      type: match[1],
      taskId: match[2],
      description: match[3],
    }
  }
}
