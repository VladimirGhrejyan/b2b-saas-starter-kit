import path from 'node:path'
import type {AliasOptions, ResolveOptions} from 'vite'

export class ViteResolvers {
  static build(root: string): ResolveOptions & {alias: AliasOptions} {
    return {
      alias: {
        '@/app': path.join(root, 'src/app'),
        '@/pages': path.join(root, 'src/pages'),
        '@/features': path.join(root, 'src/features'),
        '@/shared': path.join(root, 'src/shared'),
      },
    }
  }
}
