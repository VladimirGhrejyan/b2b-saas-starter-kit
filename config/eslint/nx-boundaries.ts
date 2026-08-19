/**
 * Intended Nx module-boundary constraints (docs/architecture/boundaries.md).
 *
 * TODO(architecture): turn on / tighten @nx/enforce-module-boundaries once projects exist with
 *   scope:shared|backend|frontend and layer:domain|application|platform|infrastructure|composition|…
 * TODO(architecture): folder-level context isolation
 *   (e.g. packages/domain/src/tenancy ↛ packages/domain/src/authorization)
 * TODO(architecture): domain purity no-restricted-imports
 *   (no @nestjs/*, typeorm, ioredis inside packages/domain)
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
