import type {InitProductOptions, KitIdentity, TextReplacement} from './init-product.types'
import {KIT_IDENTITY} from './init-product.types'

type ParseState = {
  scope?: string
  displayName?: string
  slug?: string
  shortSlug?: string
  taskPrefix?: string
  dryRun: boolean
  yes: boolean
  skipDocs: boolean
  install: boolean
}

/** Parses CLI args and builds kit → product text replacements. */
export class InitProductParser {
  static readonly #scopePattern = /^@[a-z0-9][a-z0-9._-]*$/i

  static readonly #slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

  static readonly #taskPrefixPattern = /^[A-Z][A-Z0-9]*$/

  static readonly kit: KitIdentity = KIT_IDENTITY

  static normalizeScope(raw: string): string {
    const trimmed = raw.trim()
    const withAt = trimmed.startsWith('@') ? trimmed : `@${trimmed}`

    if (!InitProductParser.#scopePattern.test(withAt)) {
      throw new Error(`Invalid npm scope "${raw}". Use letters, numbers, ".", "_", or "-" (e.g. @acme or acme).`)
    }

    return withAt.toLowerCase()
  }

  static slugify(raw: string): string {
    const slug = raw
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

    if (!InitProductParser.#slugPattern.test(slug)) {
      throw new Error(`Could not derive a slug from "${raw}". Pass --slug=your-product explicitly.`)
    }

    return slug
  }

  static deriveShortSlug(slug: string, explicit?: string): string {
    if (explicit) {
      const normalized = InitProductParser.slugify(explicit)

      if (!slug.startsWith(normalized)) {
        throw new Error(`--short-slug "${normalized}" should be a prefix of slug "${slug}".`)
      }

      return normalized
    }

    const [first = slug] = slug.split('-')

    return first
  }

  static deriveTaskPrefix(displayName: string, explicit?: string): string {
    if (explicit) {
      const prefix = explicit.trim().toUpperCase()

      if (!InitProductParser.#taskPrefixPattern.test(prefix)) {
        throw new Error(`Invalid task prefix "${explicit}". Use uppercase letters and numbers (e.g. ACME).`)
      }

      return prefix
    }

    const letters = displayName.replace(/[^a-zA-Z]/g, '').toUpperCase()

    if (letters.length >= 2) {
      return letters.slice(0, 4)
    }

    return 'PROD'
  }

  static buildReplacements(options: InitProductOptions): readonly TextReplacement[] {
    const {kit} = InitProductParser
    const scope = options.scope

    return [
      [`${kit.scope}/source`, `${scope}/source`],
      [kit.scope, scope],
      [kit.displayName, options.displayName],
      [kit.displayShort, options.displayName],
      [kit.adminTitle, options.adminTitle],
      [kit.slug, options.slug],
      [kit.httpUserAgent, options.httpUserAgent],
      [kit.apiAudience, options.apiAudience],
      [kit.shortSlug, options.shortSlug],
      [kit.taskPrefix, options.taskPrefix],
    ]
  }

  static parseArgs(argv: readonly string[]): InitProductOptions {
    const state = InitProductParser.#createParseState()

    for (let index = 0; index < argv.length; index += 1) {
      index = InitProductParser.#consumeArg(argv, index, state)
    }

    return InitProductParser.#finalizeOptions(state)
  }

  static printHelp(): void {
    process.stdout.write(`Rename the kit workspace to your product identity.

Usage:
  pnpm init:product --scope=@acme --name="Acme Cloud" [options]

Required:
  --scope=@acme          npm scope for workspace packages (with or without @)
  --name="Acme Cloud"    human-readable product name

Optional:
  --slug=acme-cloud      kebab-case slug (defaults from --name)
  --short-slug=acme      short slug for JWT issuer defaults, Postgres app name, etc.
  --prefix=ACME          commit/branch task prefix (defaults from --name)
  --skip-docs            do not rewrite docs/ (keeps kit architecture prose)
  --dry-run              print planned changes without writing files
  --install              run pnpm install after rewriting (updates the lockfile)
  --yes, -y              skip confirmation prompt

Examples:
  pnpm init:product --scope=@acme --name="Acme Cloud" --prefix=ACME --yes --install
  pnpm init:product --scope=acme --name="Acme Cloud" --slug=acme-cloud --dry-run

After renaming, review git diff, run pnpm nx sync, and update secrets in infra/env/.env.
`)
  }

  static #createParseState(): ParseState {
    return {
      dryRun: false,
      yes: false,
      skipDocs: false,
      install: false,
    }
  }

  static #consumeArg(argv: readonly string[], index: number, state: ParseState): number {
    const arg = InitProductParser.#requireArg(argv, index)

    if (arg === '--dry-run') {
      state.dryRun = true
      return index
    }

    if (arg === '--yes' || arg === '-y') {
      state.yes = true
      return index
    }

    if (arg === '--skip-docs') {
      state.skipDocs = true
      return index
    }

    if (arg === '--install') {
      state.install = true
      return index
    }

    if (arg === '--help' || arg === '-h') {
      InitProductParser.printHelp()
      process.exit(0)
    }

    const valueFlags: ReadonlyArray<readonly [flag: string, inlinePrefix: string, key: keyof ParseState]> = [
      ['--scope', '--scope=', 'scope'],
      ['--name', '--name=', 'displayName'],
      ['--slug', '--slug=', 'slug'],
      ['--short-slug', '--short-slug=', 'shortSlug'],
      ['--prefix', '--prefix=', 'taskPrefix'],
    ]

    for (const [flag, inlinePrefix, key] of valueFlags) {
      if (arg === flag || arg.startsWith(inlinePrefix)) {
        const {value, nextIndex} = InitProductParser.#readArgValue(argv, index, flag, inlinePrefix)
        // @ts-expect-error stub for ts
        state[key] = value
        return nextIndex
      }
    }

    throw new Error(`Unknown argument: ${arg}`)
  }

  static #requireArg(argv: readonly string[], index: number): string {
    const arg = argv[index]

    if (typeof arg !== 'string') {
      throw new Error('Unexpected end of argv')
    }

    return arg
  }

  static #readArgValue(
    argv: readonly string[],
    index: number,
    flag: string,
    inlinePrefix: string,
  ): {value: string; nextIndex: number} {
    const arg = InitProductParser.#requireArg(argv, index)

    if (arg === flag) {
      const next = argv[index + 1]

      if (!next || next.startsWith('-')) {
        throw new Error(`Missing value for ${flag}`)
      }

      return {value: next, nextIndex: index + 1}
    }

    if (arg.startsWith(inlinePrefix)) {
      return {value: arg.slice(inlinePrefix.length), nextIndex: index}
    }

    throw new Error(`Unknown argument: ${arg}`)
  }

  static #finalizeOptions(state: ParseState): InitProductOptions {
    const {scope, displayName} = state

    if (!scope || !displayName) {
      InitProductParser.printHelp()
      throw new Error('Required: --scope and --name')
    }

    const normalizedScope = InitProductParser.normalizeScope(scope)
    const resolvedSlug = state.slug ? InitProductParser.slugify(state.slug) : InitProductParser.slugify(displayName)
    const resolvedShortSlug = InitProductParser.deriveShortSlug(resolvedSlug, state.shortSlug)
    const resolvedPrefix = InitProductParser.deriveTaskPrefix(displayName, state.taskPrefix)
    const trimmedName = displayName.trim()

    return {
      scope: normalizedScope,
      displayName: trimmedName,
      slug: resolvedSlug,
      shortSlug: resolvedShortSlug,
      taskPrefix: resolvedPrefix,
      adminTitle: `${trimmedName} Admin`,
      apiAudience: `${resolvedShortSlug}-api`,
      httpUserAgent: `${resolvedShortSlug}-http-client`,
      postgresAppName: resolvedShortSlug,
      jwtIssuer: resolvedSlug,
      dryRun: state.dryRun,
      yes: state.yes,
      skipDocs: state.skipDocs,
      install: state.install,
    }
  }
}
