import 'reflect-metadata'

import {loadPostgresConfigFromEnv} from '../config/load-postgres-config'
import {createDataSource} from '../data-source/create-data-source'

/**
 * DataSource export for an optional raw TypeORM CLI
 * (`pnpm exec node --import @swc-node/register/esm-register ./node_modules/typeorm/cli.js -d this-file`).
 * Nx create/generate use TypeormMigrationCli instead.
 */
const dataSource = createDataSource(loadPostgresConfigFromEnv())

export default dataSource
