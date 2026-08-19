/**
 * Import sort groups for backend / frontend / default tooling.
 * See .cursor/rules/tooling/imports.mdc and docs/architecture/workspace-topology.md
 */
export class ImportGroups {
  static readonly backend: string[][] = [
    ['^node:'],
    ['^@?\\w'],
    [
      '^@b2b-saas-starter-kit/shared-kernel-types',
      '^@b2b-saas-starter-kit/utils',
      '^@b2b-saas-starter-kit/config-validation',
      '^@b2b-saas-starter-kit/contracts',
    ],
    ['^@b2b-saas-starter-kit/domain'],
    ['^@b2b-saas-starter-kit/platform'],
    ['^@b2b-saas-starter-kit/application'],
    ['^@b2b-saas-starter-kit/infrastructure'],
    ['^@b2b-saas-starter-kit/composition'],
    ['^@b2b-saas-starter-kit/'],
    ['^\\u0000'],
    ['^\\.\\.(?!/?$)', '^\\.\\./?$'],
    ['^\\./(?=.*/)(?!/?$)', '^\\.(?!/?$)', '^\\./?$'],
  ]

  static readonly frontend: string[][] = [
    ['^react$', '^react-dom', '^react/'],
    ['^@?\\w'],
    [
      '^@b2b-saas-starter-kit/contracts',
      '^@b2b-saas-starter-kit/shared-kernel-types',
      '^@b2b-saas-starter-kit/utils',
      '^@b2b-saas-starter-kit/config-validation',
      '^@b2b-saas-starter-kit/frontend-ui',
      '^@b2b-saas-starter-kit/frontend-core',
    ],
    ['^@b2b-saas-starter-kit/'],
    ['^@/'],
    ['^\\u0000'],
    ['^\\.\\.(?!/?$)', '^\\.\\./?$'],
    ['^\\./(?=.*/)(?!/?$)', '^\\.(?!/?$)', '^\\./?$'],
    ['^.+\\.s?css$'],
  ]

  /** Fallback for root tooling / shared leaves before they get their own overrides. */
  static readonly default: string[][] = [
    ['^node:'],
    ['^@?\\w'],
    ['^@b2b-saas-starter-kit/'],
    ['^\\u0000'],
    ['^\\.\\.(?!/?$)', '^\\.\\./?$'],
    ['^\\./(?=.*/)(?!/?$)', '^\\.(?!/?$)', '^\\./?$'],
  ]
}
