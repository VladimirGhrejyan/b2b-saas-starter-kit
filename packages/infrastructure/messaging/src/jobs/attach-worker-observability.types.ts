export type FailedObservableJob = {
  readonly id?: string
  readonly name: string
  readonly attemptsMade: number
  readonly opts: {readonly attempts?: number}
}

export type ObservableWorker = {
  on(event: 'error', listener: (error: Error) => void): unknown
  on(event: 'stalled', listener: (jobId: string) => void): unknown
  on(event: 'failed', listener: (job: FailedObservableJob | undefined, error: Error) => void): unknown
}
