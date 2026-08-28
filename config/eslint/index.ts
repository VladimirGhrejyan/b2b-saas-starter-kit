import type {Linter} from 'eslint'
import prettier from 'eslint-config-prettier'

import {ApplicationEslintConfig} from './application'
import {AppsEslintConfig} from './apps'
import {BackendEslintConfig} from './backend'
import {EslintBase} from './base'
import {CompositionEslintConfig} from './composition'
import {ContractsEslintConfig} from './contracts'
import {DomainEslintConfig} from './domain'
import {FrontendEslintConfig} from './frontend'
import {FrontendCoreEslintConfig} from './frontend-core'
import {EslintIgnores} from './ignores'
import {InfrastructureEslintConfig} from './infrastructure'
import {NestHttpEslintConfig} from './nest-http'
import {PlatformEslintConfig} from './platform'
import {TestsEslintConfig} from './tests'
import {ToolingEslintConfig} from './tooling'
import {UiKitEslintConfig} from './ui-kit'

/**
 * Ordered flat-config fragments for the workspace root entry.
 * files/ignores patterns are workspace-root-relative.
 */
export class EslintFlatConfig {
  static readonly configs: Linter.Config[] = [
    EslintIgnores.config,
    ...EslintBase.configs,
    BackendEslintConfig.config,
    AppsEslintConfig.config,
    DomainEslintConfig.config,
    PlatformEslintConfig.config,
    ApplicationEslintConfig.config,
    CompositionEslintConfig.config,
    ContractsEslintConfig.config,
    NestHttpEslintConfig.config,
    InfrastructureEslintConfig.config,
    FrontendEslintConfig.config,
    UiKitEslintConfig.config,
    FrontendCoreEslintConfig.config,
    TestsEslintConfig.config,
    ToolingEslintConfig.config,
    prettier,
  ]
}
