import {readFileSync, writeFileSync} from 'node:fs'

import {CommitHeader} from './commit-header'
import {Conventions} from './conventions'
import {GitBranch} from './git-branch'

/** Husky prepare-commit-msg: auto-prefix bare subjects from the branch name. */
export class PrepareCommitMsg {
  static run(argv: string[]): void {
    const messageFile = argv[0]
    const source = argv[1] ?? ''

    if (!messageFile) {
      console.error('prepare-commit-msg: missing commit message file path')
      process.exit(1)
    }

    // Amend / merge / squash: keep the existing message as-is.
    if (source === 'merge' || source === 'squash' || source === 'commit') {
      process.exit(0)
    }

    const conventions = Conventions.load()
    const branch = GitBranch.current()

    if (!branch || conventions.isExemptBranch(branch)) {
      process.exit(0)
    }

    const parsedBranch = GitBranch.parse(branch, conventions)

    if (!parsedBranch) {
      process.exit(0)
    }

    const original = readFileSync(messageFile, 'utf8')

    if (CommitHeader.hasConventionalHeader(original)) {
      process.exit(0)
    }

    const subject = CommitHeader.extractBareSubject(original)

    if (!subject) {
      process.exit(0)
    }

    const rest = original.includes('\n') ? original.slice(original.indexOf('\n')) : '\n'
    const header = `${parsedBranch.type}(${parsedBranch.taskId}): ${subject}`

    writeFileSync(messageFile, `${header}${rest.startsWith('\n') ? rest : `\n${rest}`}`)
  }
}

PrepareCommitMsg.run(process.argv.slice(2))
