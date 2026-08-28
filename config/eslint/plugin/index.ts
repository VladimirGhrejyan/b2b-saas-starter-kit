import type {ESLint} from 'eslint'

import {dtsInTypesFolderRule} from './rules/dts-in-types-folder'
import {maxClassesPerFileRule} from './rules/max-classes-per-file'
import {maxStandaloneFunctionsRule} from './rules/max-standalone-functions'
import {noCrossContextImportsRule} from './rules/no-cross-context-imports'
import {noFsdUpwardImportsRule} from './rules/no-fsd-upward-imports'
import {noMixedFileDeclarationsRule} from './rules/no-mixed-file-declarations'

/** Workspace ESLint plugin for file-structure conventions. */
export class WorkspaceEslintPlugin {
  static readonly name = '@b2b-saas-starter-kit'

  static readonly plugin = {
    meta: {
      name: '@b2b-saas-starter-kit/eslint-plugin',
      version: '0.0.0',
    },
    rules: {
      'max-standalone-functions': maxStandaloneFunctionsRule,
      'max-classes-per-file': maxClassesPerFileRule,
      'no-mixed-file-declarations': noMixedFileDeclarationsRule,
      'no-cross-context-imports': noCrossContextImportsRule,
      'no-fsd-upward-imports': noFsdUpwardImportsRule,
      'dts-in-types-folder': dtsInTypesFolderRule,
    },
  } as unknown as ESLint.Plugin
}

export const workspaceEslintPlugin = WorkspaceEslintPlugin.plugin
