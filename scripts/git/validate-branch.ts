import {Conventions} from './conventions'
import {GitBranch} from './git-branch'

/** Husky pre-push: validate branch naming conventions. */
export class ValidateBranch {
  static run(): void {
    const conventions = Conventions.load()
    const branch = GitBranch.current()

    if (!branch) {
      console.error('Invalid branch name: detached HEAD is not allowed for push.')
      console.error('Checkout a branch named: <type>/<task-id>/<kebab-description>')
      console.error(`Example: ${conventions.exampleBranch()}`)
      process.exit(1)
    }

    if (conventions.isExemptBranch(branch)) {
      process.exit(0)
    }

    if (GitBranch.parse(branch, conventions)) {
      process.exit(0)
    }

    const types = conventions.types.join('|')

    console.error('Invalid branch name.')
    console.error(`  current: ${branch}`)
    console.error(`  expected: <type>/${conventions.taskPrefix}-<number>/<kebab-description>`)
    console.error(`  types: ${types}`)
    console.error(`  example: ${conventions.exampleBranch()}`)
    process.exit(1)
  }
}

ValidateBranch.run()
