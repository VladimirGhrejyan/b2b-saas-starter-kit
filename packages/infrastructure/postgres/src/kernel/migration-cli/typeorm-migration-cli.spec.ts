import {describe, expect, it} from 'vitest'

import {TypeormMigrationCli} from './typeorm-migration-cli'

describe('TypeormMigrationCli', () => {
  it('reads --name= and strips a .ts suffix', () => {
    expect(TypeormMigrationCli.readName(['node', 'generate.ts', '--name=tenancy-add-slug.ts'])).toBe('tenancy-add-slug')
  })

  it('reads --name followed by a separate argument', () => {
    expect(TypeormMigrationCli.readName(['node', 'create.ts', '--name', 'authorization-add-flag'])).toBe(
      'authorization-add-flag',
    )
  })

  it('reads a positional context-prefixed name', () => {
    expect(TypeormMigrationCli.readName(['jiti', 'create.ts', 'identity-add-phone'])).toBe('identity-add-phone')
  })

  it('rejects a name without a context prefix', () => {
    expect(() => TypeormMigrationCli.assertMigrationName('add-slug')).toThrow(/context-prefixed/)
  })

  it('rejects a path', () => {
    expect(() => TypeormMigrationCli.assertMigrationName('../tenancy-add-slug')).toThrow(/not a path/)
  })
})
