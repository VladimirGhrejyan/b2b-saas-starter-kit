import type {ParsedCommitHeader} from './types'

/** Conventional commit header parsing and bare-subject extraction. */
export class CommitHeader {
  static parse(header: string): ParsedCommitHeader | null {
    const match = /^(?<type>[a-z]+)(?:\((?<scope>[^)]*)\))?!?:\s*(?<subject>.+)$/.exec(header.trim())

    if (!match?.groups?.type || !match.groups.subject) {
      return null
    }

    return {
      type: match.groups.type,
      scope: match.groups.scope ? match.groups.scope : '',
      subject: match.groups.subject.trim(),
    }
  }

  static firstMeaningfulLine(message: string): string | null {
    for (const line of message.split(/\r?\n/)) {
      const trimmed = line.trim()

      if (trimmed.length === 0 || trimmed.startsWith('#')) {
        continue
      }

      return trimmed
    }

    return null
  }

  static hasConventionalHeader(message: string): boolean {
    const header = CommitHeader.firstMeaningfulLine(message)

    if (!header) {
      return false
    }

    return CommitHeader.parse(header) !== null
  }

  static extractBareSubject(message: string): string | null {
    const header = CommitHeader.firstMeaningfulLine(message)

    if (!header || CommitHeader.hasConventionalHeader(message)) {
      return null
    }

    return header
  }
}
