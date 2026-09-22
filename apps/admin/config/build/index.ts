/// <reference types="vitest" />

import {fileURLToPath} from 'node:url'
import type {ConfigEnv} from 'vite'
import type {ViteUserConfig} from 'vitest/config'

import {ViteBuildConfig} from './build-config/vite-build-config'
import {VitePlugins} from './plugins/vite-plugins'
import {ViteResolvers} from './resolvers/vite-resolvers'
import {ViteServerOptions} from './server/vite-server-options'
import {ViteTestOptions} from './test/vite-test-options'

export class ViteConfig {
  static readonly root = fileURLToPath(new URL('../..', import.meta.url))

  static build(env: ConfigEnv): ViteUserConfig {
    return {
      root: ViteConfig.root,
      cacheDir: '../../node_modules/.vite/apps/admin',
      server: ViteServerOptions.build(),
      preview: ViteServerOptions.buildPreview(),
      resolve: ViteResolvers.build(ViteConfig.root),
      base: process.env.VITE_BASE ?? '/',
      plugins: VitePlugins.build(env),
      build: ViteBuildConfig.build(),
      test: ViteTestOptions.build(),
    }
  }
}
