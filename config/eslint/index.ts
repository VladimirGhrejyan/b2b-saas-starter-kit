import type {Linter} from 'eslint'
import prettier from 'eslint-config-prettier'

import {BackendEslintConfig} from './backend'
import {EslintBase} from './base'
import {DomainEslintConfig} from './domain'
import {FrontendEslintConfig} from './frontend'
import {EslintIgnores} from './ignores'
import {PlatformEslintConfig} from './platform'
import {TestsEslintConfig} from './tests'
import {ToolingEslintConfig} from './tooling'

/**
 * Ordered flat-config fragments for the workspace root entry.
 * files/ignores patterns are workspace-root-relative.
 */
export class EslintFlatConfig {
  static readonly configs: Linter.Config[] = [
    EslintIgnores.config,
    ...EslintBase.configs,
    BackendEslintConfig.config,
    DomainEslintConfig.config,
    PlatformEslintConfig.config,
    FrontendEslintConfig.config,
    TestsEslintConfig.config,
    ToolingEslintConfig.config,
    prettier,
  ]
}
