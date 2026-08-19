import type {UserConfig} from '@commitlint/types'

import {Conventions} from '../../scripts/git/conventions'

import {CommitlintConventionsPlugin} from './conventions-plugin'

/** Builds the workspace Commitlint user config from project conventions. */
export class CommitlintConfig {
  static create(): UserConfig {
    const conventions = Conventions.load()

    return {
      extends: ['@commitlint/config-conventional'],
      formatter: '@commitlint/format',
      plugins: [CommitlintConventionsPlugin.create(conventions)],
      rules: {
        'type-empty': [2, 'never'],
        'type-enum': [2, 'always', conventions.types],
        'scope-empty': [2, 'never'],
        'subject-case': [0],
        'header-max-length': [2, 'always', 200],
        'task-id-scope': [2, 'always'],
        'scope-matches-branch': [2, 'always'],
      },
    }
  }
}
