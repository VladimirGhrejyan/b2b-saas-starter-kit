import type {Plugin, Rule} from '@commitlint/types'

import type {Conventions} from '../../scripts/git/conventions'
import {GitBranch} from '../../scripts/git/git-branch'

/** Commitlint plugin rules for task-id scope and branch matching. */
export class CommitlintConventionsPlugin {
  static create(conventions: Conventions): Plugin {
    return {
      rules: {
        'task-id-scope': CommitlintConventionsPlugin.taskIdScope(conventions),
        'scope-matches-branch': CommitlintConventionsPlugin.scopeMatchesBranch(conventions),
      },
    }
  }

  private static taskIdScope(conventions: Conventions): Rule {
    return (parsed) => {
      const scope = parsed.scope ?? ''

      if (!conventions.isValidTaskId(scope)) {
        return [
          false,
          `scope must be a task id matching ${conventions.taskPrefix}-<number> (e.g. ${conventions.taskPrefix}-1)`,
        ]
      }

      return [true]
    }
  }

  private static scopeMatchesBranch(conventions: Conventions): Rule {
    return (parsed) => {
      const branch = GitBranch.current()

      if (!branch || conventions.isExemptBranch(branch)) {
        return [true]
      }

      const parsedBranch = GitBranch.parse(branch, conventions)

      if (!parsedBranch) {
        // Branch format is enforced on pre-push; do not block commits on a WIP branch name.
        return [true]
      }

      const commitType = parsed.type ?? ''
      const commitScope = parsed.scope ?? ''

      if (commitType !== parsedBranch.type || commitScope !== parsedBranch.taskId) {
        return [
          false,
          `commit type/scope must match branch: expected ${parsedBranch.type}(${parsedBranch.taskId}), got ${commitType}(${commitScope})`,
        ]
      }

      return [true]
    }
  }
}
