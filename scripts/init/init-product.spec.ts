import {describe, expect, it} from 'vitest'

import {InitProductParser} from './init-product-parsing'

describe('InitProductParser', () => {
  it('normalizes scope with or without @', () => {
    expect(InitProductParser.normalizeScope('acme')).toBe('@acme')
    expect(InitProductParser.normalizeScope('@Acme')).toBe('@acme')
  })

  it('derives slug and short slug from display name', () => {
    expect(InitProductParser.slugify('Acme Cloud')).toBe('acme-cloud')
    expect(InitProductParser.deriveShortSlug('acme-cloud')).toBe('acme')
  })

  it('derives task prefix from display name', () => {
    expect(InitProductParser.deriveTaskPrefix('Acme Cloud')).toBe('ACME')
    expect(InitProductParser.deriveTaskPrefix('Acme Cloud', 'XY')).toBe('XY')
  })

  it('builds replacements longest-first safe strings', () => {
    const options = InitProductParser.parseArgs(['--scope=@acme', '--name=Acme Cloud', '--prefix=ACME'])

    expect(InitProductParser.buildReplacements(options)).toEqual([
      ['@b2b-saas-starter-kit/source', '@acme/source'],
      ['@b2b-saas-starter-kit', '@acme'],
      ['B2B SaaS Starter Kit', 'Acme Cloud'],
      ['B2B SaaS Starter', 'Acme Cloud'],
      ['B2B SaaS Admin', 'Acme Cloud Admin'],
      ['b2b-saas-starter-kit', 'acme-cloud'],
      ['b2b-saas-http-client', 'acme-http-client'],
      ['b2b-saas-api', 'acme-api'],
      ['b2b-saas', 'acme'],
      ['VC', 'ACME'],
    ])
  })

  it('parses flags and options', () => {
    const options = InitProductParser.parseArgs([
      '--scope=acme',
      '--name=Acme Cloud',
      '--slug=acme-platform',
      '--short-slug=acme',
      '--prefix=ACP',
      '--skip-docs',
      '--dry-run',
      '--install',
      '--yes',
    ])

    expect(options).toMatchObject({
      scope: '@acme',
      displayName: 'Acme Cloud',
      slug: 'acme-platform',
      shortSlug: 'acme',
      taskPrefix: 'ACP',
      skipDocs: true,
      dryRun: true,
      install: true,
      yes: true,
    })
  })
})
