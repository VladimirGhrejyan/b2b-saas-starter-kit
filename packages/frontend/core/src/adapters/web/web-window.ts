import type {WindowPort} from '../../ports/window.port'

export class WebWindowAdapter implements WindowPort {
  setTitle(_title: string): void {
    return
  }

  minimize(): void {
    return
  }
}
