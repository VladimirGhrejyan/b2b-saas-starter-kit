import type {Linter} from 'eslint'
import prettier from 'eslint-config-prettier'

import {ApplicationEslintConfig} from './application'
import {BackendEslintConfig} from './backend'
import {EslintBase} from './base'
import {ContractsEslintConfig} from './contracts'
import {DomainEslintConfig} from './domain'
import {FrontendEslintConfig} from './frontend'
import {EslintIgnores} from './ignores'
import {InfrastructureEslintConfig} from './infrastructure'
import {NestHttpEslintConfig} from './nest-http'
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
    ApplicationEslintConfig.config,
    ContractsEslintConfig.config,
    NestHttpEslintConfig.config,
    InfrastructureEslintConfig.config,
    FrontendEslintConfig.config,
    TestsEslintConfig.config,
    ToolingEslintConfig.config,
    prettier,
  ]
}
