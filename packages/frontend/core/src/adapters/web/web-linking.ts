import type {LinkingPort} from '../../ports/linking.port'

export class WebLinkingAdapter implements LinkingPort {
  open(url: string): void {
    if (typeof window === 'undefined') {
      return
    }

    window.location.assign(url)
  }

  subscribe(_listener: (url: string) => void): () => void {
    return () => undefined
  }
}
