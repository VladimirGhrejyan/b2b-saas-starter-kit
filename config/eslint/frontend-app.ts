import type {Linter} from 'eslint'

const configMessage =
  'Do not import ConfigLoader in app src. Bake config in the Vite plugin and import virtual:web-config or virtual:admin-config.'

/** FSD downward imports + no ConfigLoader in React modules. */
export class FrontendAppEslintConfig {
  static readonly config: Linter.Config = {
    files: ['apps/web/src/**/*.{ts,tsx}', 'apps/admin/src/**/*.{ts,tsx}'],
    rules: {
      '@b2b-saas-starter-kit/no-fsd-upward-imports': 'error',
      'no-restricted-imports': [
        'error',
        {
          paths: [{name: '@b2b-saas-starter-kit/config', message: configMessage}],
        },
      ],
    },
  }
}
