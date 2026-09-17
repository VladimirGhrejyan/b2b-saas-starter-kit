import {execSync} from 'node:child_process'
import {readdirSync, readFileSync, statSync, writeFileSync} from 'node:fs'
import {join, relative} from 'node:path'
import {createInterface} from 'node:readline/promises'

import type {InitProductOptions, TextReplacement} from './init-product.types'
import {InitProductParser} from './init-product-parsing'

/** Rewrites workspace files from kit identity to a product identity. */
export class InitProduct {
  static readonly textExtensions = new Set([
    '.ts',
    '.tsx',
    '.mts',
    '.cts',
    '.json',
    '.yaml',
    '.yml',
    '.md',
    '.mdc',
    '.html',
    '.example',
    '.mjs',
    '.cjs',
  ])

  static readonly ignoredDirs = new Set([
    '.git',
    '.nx',
    '.pnpm-store',
    '.vite',
    '.vitest',
    'coverage',
    'dist',
    'node_modules',
    'out-tsc',
    'tmp',
    'build',
    'static',
  ])

  static readonly ignoredFiles = new Set(['pnpm-lock.yaml'])

  static async run(argv: readonly string[] = process.argv.slice(2)): Promise<void> {
    let options: InitProductOptions

    try {
      options = InitProductParser.parseArgs(argv)
    } catch (error) {
      process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
      process.exit(1)
    }

    if (options.scope === InitProductParser.kit.scope) {
      process.stderr.write('Scope matches the kit default. Pass a different --scope.\n')
      process.exit(1)
    }

    InitProduct.#assertNotAlreadyRenamed()

    InitProduct.#printPlan(options)

    if (!options.yes && !options.dryRun) {
      const confirmed = await InitProduct.#confirm('Apply these changes?')

      if (!confirmed) {
        process.stdout.write('Aborted.\n')
        process.exit(0)
      }
    }

    const replacements = InitProductParser.buildReplacements(options)
    const changed = InitProduct.#rewriteWorkspace('.', options, replacements)

    process.stdout.write(`\nUpdated ${String(changed.length)} file(s).\n`)

    if (options.dryRun) {
      for (const file of changed) {
        process.stdout.write(`  would update ${file}\n`)
      }

      process.stdout.write('\nDry run complete. Re-run without --dry-run to apply.\n')

      return
    }

    for (const file of changed) {
      process.stdout.write(`  updated ${file}\n`)
    }

    if (options.install) {
      process.stdout.write('\nRunning pnpm install to refresh the lockfile…\n')
      execSync('pnpm install', {stdio: 'inherit', env: {...process.env, HUSKY: '0'}})
    } else {
      process.stdout.write('\nNext: pnpm install && pnpm nx sync\n')
    }
  }

  static #assertNotAlreadyRenamed(): void {
    const {kit} = InitProductParser

    try {
      const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as {name?: string}

      if (pkg.name && pkg.name !== `${kit.scope}/source`) {
        throw new Error(
          `Root package is already "${pkg.name}". This script expects "${kit.scope}/source". Fork a fresh kit copy or revert package.json first.`,
        )
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('already')) {
        throw error
      }

      throw new Error('Could not read package.json from the workspace root.', {cause: error})
    }
  }

  static #printPlan(options: InitProductOptions): void {
    process.stdout.write(`${options.dryRun ? 'Dry run' : 'Plan'}: rename kit → product\n\n`)
    process.stdout.write(`  scope:        ${options.scope}\n`)
    process.stdout.write(`  name:         ${options.displayName}\n`)
    process.stdout.write(`  slug:         ${options.slug}\n`)
    process.stdout.write(`  short slug:   ${options.shortSlug}\n`)
    process.stdout.write(`  task prefix:  ${options.taskPrefix}\n`)
    process.stdout.write(`  admin title:  ${options.adminTitle}\n`)
    process.stdout.write(`  JWT issuer:   ${options.jwtIssuer}\n`)
    process.stdout.write(`  skip docs:    ${options.skipDocs ? 'yes' : 'no'}\n\n`)
  }

  static async #confirm(question: string): Promise<boolean> {
    const rl = createInterface({input: process.stdin, output: process.stdout})
    const answer = (await rl.question(`${question} [y/N] `)).trim().toLowerCase()

    rl.close()

    return answer === 'y' || answer === 'yes'
  }

  static #rewriteWorkspace(
    rootDir: string,
    options: InitProductOptions,
    replacements: readonly TextReplacement[],
  ): string[] {
    const changed: string[] = []

    for (const absolutePath of InitProduct.#walkFiles(rootDir)) {
      const relativePath = relative(rootDir, absolutePath)

      if (InitProduct.#shouldSkipPath(relativePath, options)) {
        continue
      }

      const original = readFileSync(absolutePath, 'utf8')
      const updated = InitProduct.#applyReplacements(original, replacements)

      if (updated === original) {
        continue
      }

      if (!options.dryRun) {
        writeFileSync(absolutePath, updated, 'utf8')
      }

      changed.push(relativePath)
    }

    return changed.sort()
  }

  static #shouldSkipPath(relativePath: string, options: InitProductOptions): boolean {
    if (relativePath === 'scripts/init' || relativePath.startsWith('scripts/init/')) {
      return true
    }

    if (options.skipDocs && (relativePath === 'docs' || relativePath.startsWith('docs/'))) {
      return true
    }

    if (relativePath.startsWith('.cursor/plans/')) {
      return true
    }

    return false
  }

  static *#walkFiles(dir: string): Generator<string> {
    for (const entry of readdirSync(dir)) {
      const absolutePath = join(dir, entry)

      if (InitProduct.ignoredDirs.has(entry)) {
        continue
      }

      const stats = statSync(absolutePath)

      if (stats.isDirectory()) {
        yield* InitProduct.#walkFiles(absolutePath)
        continue
      }

      if (!stats.isFile()) {
        continue
      }

      if (InitProduct.ignoredFiles.has(entry)) {
        continue
      }

      const extension = entry.includes('.') ? entry.slice(entry.lastIndexOf('.')) : ''

      if (!InitProduct.textExtensions.has(extension)) {
        continue
      }

      yield absolutePath
    }
  }

  static #applyReplacements(content: string, replacements: readonly TextReplacement[]): string {
    let result = content

    for (const [from, to] of replacements) {
      result = result.split(from).join(to)
    }

    return result
  }
}
