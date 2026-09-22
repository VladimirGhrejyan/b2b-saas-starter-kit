import react from '@vitejs/plugin-react'
import type {ConfigEnv, PluginOption} from 'vite'
import checker from 'vite-plugin-checker'

import {AdminConfigPlugin} from './admin-config/admin-config.plugin'

export class VitePlugins {
  static build(env: ConfigEnv): PluginOption[] {
    const plugins: PluginOption[] = [react(), AdminConfigPlugin.create()]

    if (VitePlugins.isDevServe(env)) {
      plugins.push(
        checker({
          typescript: {
            tsconfigPath: 'tsconfig.app.json',
            buildMode: true,
          },
        }),
      )
    }

    return plugins
  }

  private static isDevServe(env: ConfigEnv): boolean {
    return env.command === 'serve' && env.mode === 'development' && !process.env.VITEST
  }
}
