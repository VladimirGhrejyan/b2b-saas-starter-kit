import type {PreviewOptions, ServerOptions} from 'vite'

export class ViteServerOptions {
  static build(): ServerOptions {
    return {
      port: 4200,
      host: 'localhost',
    }
  }

  static buildPreview(): PreviewOptions {
    return {
      port: 4200,
      host: 'localhost',
    }
  }
}
