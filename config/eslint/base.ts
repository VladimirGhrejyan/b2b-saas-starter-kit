import {fileURLToPath} from 'node:url'

import js from '@eslint/js'
import nxPlugin from '@nx/eslint-plugin'
import type {Linter} from 'eslint'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import sonarjs from 'eslint-plugin-sonarjs'
import unicorn from 'eslint-plugin-unicorn'
import unusedImports from 'eslint-plugin-unused-imports'
import globals from 'globals'
import tseslint from 'typescript-eslint'

import {ImportGroups} from './import-groups'
import {NxBoundaries} from './nx-boundaries'
import {WorkspaceEslintPlugin} from './plugin'

/** Shared language options, plugins, rules, and base flat-config fragments. */
export class EslintBase {
  /** Workspace root (config/eslint → ../..) */
  static readonly workspaceRoot = fileURLToPath(new URL('../..', import.meta.url))

  static readonly languageOptions = {
    parser: tseslint.parser,
    parserOptions: {
      // Tooling is owned by tsconfig.tooling.json; app/lib tsconfigs will own the rest.
      projectService: {
        allowDefaultProject: [],
        maximumDefaultProjectFileMatchCount_THIS_WILL_SLOW_DOWN_LINTING: 50,
      },
      tsconfigRootDir: EslintBase.workspaceRoot,
    },
  }

  static readonly plugins = {
    '@typescript-eslint': tseslint.plugin,
    'unused-imports': unusedImports,
    'simple-import-sort': simpleImportSort,
    sonarjs,
    unicorn,
    '@nx': nxPlugin,
    [WorkspaceEslintPlugin.name]: WorkspaceEslintPlugin.plugin,
  }

  static readonly rules: Linter.RulesRecord = {
    ...js.configs.recommended.rules,

    eqeqeq: ['error', 'always'],
    'no-console': 'warn',
    'no-unused-vars': 'off',
    'no-undef': 'off',
    'no-redeclare': 'off',

    '@typescript-eslint/restrict-template-expressions': 'off',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/require-await': 'warn',
    '@typescript-eslint/consistent-type-imports': [
      'error',
      {prefer: 'type-imports', fixStyle: 'separate-type-imports'},
    ],
    '@typescript-eslint/no-extraneous-class': 'off',
    '@typescript-eslint/unbound-method': [
      'error',
      {
        ignoreStatic: true,
      },
    ],

    'unused-imports/no-unused-imports': 'warn',
    'unused-imports/no-unused-vars': [
      'warn',
      {
        vars: 'all',
        varsIgnorePattern: '^_',
        args: 'after-used',
        argsIgnorePattern: '^_',
      },
    ],

    'simple-import-sort/imports': ['error', {groups: ImportGroups.default}],
    'simple-import-sort/exports': 'error',

    'sonarjs/cognitive-complexity': ['warn', 15],
    'max-lines-per-function': ['warn', 80],
    'max-depth': ['warn', 4],

    'unicorn/prefer-node-protocol': 'error',
    'unicorn/no-static-only-class': 'off',

    'padding-line-between-statements': [
      'error',
      {blankLine: 'always', prev: '*', next: 'return'},
      {blankLine: 'always', prev: ['block', 'block-like'], next: '*'},
      {blankLine: 'always', prev: '*', next: ['block', 'block-like']},
      {blankLine: 'always', prev: ['const', 'let', 'var'], next: '*'},
      {blankLine: 'any', prev: ['const', 'let', 'var'], next: ['const', 'let', 'var']},
    ],
    'lines-between-class-members': ['error', 'always'],

    // Scaffolded now; becomes meaningful once projects carry scope:* / layer:* tags.
    '@nx/enforce-module-boundaries': [
      'error',
      {
        enforceBuildableLibDependency: true,
        allow: [],
        depConstraints: NxBoundaries.depConstraints,
      },
    ],

    '@b2b-saas-starter-kit/max-standalone-functions': 'error',
    '@b2b-saas-starter-kit/max-classes-per-file': 'error',
    '@b2b-saas-starter-kit/no-mixed-file-declarations': 'error',
    '@b2b-saas-starter-kit/dts-in-types-folder': 'error',
  }

  /** Type-aware strict preset + default shared rules for all source files. */
  static readonly configs: Linter.Config[] = [
    ...(tseslint.configs.strictTypeChecked.map((config) => ({
      ...config,
      files: ['**/*.{ts,tsx,mts,cts}'],
    })) as Linter.Config[]),
    {
      files: ['**/*.{ts,tsx,mts,cts,js,jsx,mjs,cjs}'],
      languageOptions: {
        ...EslintBase.languageOptions,
        globals: {
          ...globals.node,
        },
      },
      plugins: EslintBase.plugins as unknown as Linter.Config['plugins'],
      rules: EslintBase.rules,
    },
  ]
}
