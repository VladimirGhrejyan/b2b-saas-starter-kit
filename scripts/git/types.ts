export type ConventionsData = {
  taskPrefix: string
  types: string[]
  exemptBranches: string[]
}

export type ParsedBranch = {
  type: string
  taskId: string
  description: string
}

export type ParsedCommitHeader = {
  type: string
  scope: string
  subject: string
}
