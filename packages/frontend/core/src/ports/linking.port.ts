export interface LinkingPort {
  open(url: string): void
  subscribe(listener: (url: string) => void): () => void
}
