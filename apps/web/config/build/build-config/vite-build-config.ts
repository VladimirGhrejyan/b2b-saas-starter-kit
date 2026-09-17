import type {BuildOptions} from 'vite'

export class ViteBuildConfig {
  static build(): BuildOptions {
    return {
      outDir: './dist',
      emptyOutDir: true,
      reportCompressedSize: true,
      commonjsOptions: {
        transformMixedEsModules: true,
      },
    }
  }
}
