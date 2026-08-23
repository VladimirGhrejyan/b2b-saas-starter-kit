/**
 * Nx module-boundary constraints (docs/architecture/boundaries.md).
 *
 * Active: `@nx/enforce-module-boundaries` (this file), folder-level context isolation
 *   (`@b2b-saas-starter-kit/no-cross-context-imports`), and domain-purity
 *   `no-restricted-imports` (`config/eslint/domain.ts`).
 */
export class NxBoundaries {
  static readonly depConstraints = [
    {sourceTag: 'scope:shared', onlyDependOnLibsWithTags: ['scope:shared']},
    {sourceTag: 'scope:backend', onlyDependOnLibsWithTags: ['scope:backend', 'scope:shared']},
    {sourceTag: 'scope:frontend', onlyDependOnLibsWithTags: ['scope:frontend', 'scope:shared']},

    {sourceTag: 'layer:domain', onlyDependOnLibsWithTags: ['layer:shared-types']},
    {sourceTag: 'layer:platform', onlyDependOnLibsWithTags: ['layer:shared-types']},
    {
      sourceTag: 'layer:application',
      onlyDependOnLibsWithTags: ['layer:domain', 'layer:platform', 'layer:shared-types', 'layer:utils'],
    },
    {
      sourceTag: 'layer:infrastructure',
      onlyDependOnLibsWithTags: [
        'layer:domain',
        'layer:application',
        'layer:platform',
        'layer:shared-types',
        'layer:utils',
        'layer:config',
      ],
    },
    {
      sourceTag: 'layer:composition',
      onlyDependOnLibsWithTags: [
        'layer:domain',
        'layer:application',
        'layer:infrastructure',
        'layer:platform',
        'layer:shared-types',
        'layer:utils',
        'layer:config',
      ],
    },

    {sourceTag: 'layer:ui', onlyDependOnLibsWithTags: ['layer:utils']},
    {
      sourceTag: 'layer:frontend-core',
      onlyDependOnLibsWithTags: ['layer:contracts', 'layer:shared-types', 'layer:utils', 'layer:config'],
    },
    {
      sourceTag: 'layer:feature',
      onlyDependOnLibsWithTags: [
        'layer:ui',
        'layer:frontend-core',
        'layer:contracts',
        'layer:shared-types',
        'layer:utils',
      ],
    },

    {
      sourceTag: 'type:app',
      onlyDependOnLibsWithTags: [
        'layer:composition',
        'layer:ui',
        'layer:frontend-core',
        'layer:feature',
        'layer:contracts',
        'layer:shared-types',
        'layer:utils',
        'layer:config',
      ],
    },
  ]
}
