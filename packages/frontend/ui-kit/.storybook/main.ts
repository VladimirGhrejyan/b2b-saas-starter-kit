import type {StorybookConfig} from '@storybook/react-vite'

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: [],
  framework: '@storybook/react-vite',
  viteFinal(viteConfig) {
    return {
      ...viteConfig,
      base: process.env.STORYBOOK_BASE ?? viteConfig.base,
    }
  },
}

export default config
