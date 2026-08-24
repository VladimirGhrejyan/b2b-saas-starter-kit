import {loadPostgresConfigFromEnv} from '../config/load-postgres-config'
import {createDataSource} from '../data-source/create-data-source'

const dataSource = createDataSource(loadPostgresConfigFromEnv())

export default dataSource
