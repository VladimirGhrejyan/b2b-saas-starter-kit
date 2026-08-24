import type {EntitySchema} from 'typeorm'

export type DataSourceClass = new () => object

export type CreateDataSourceOptions = {
  readonly entities?: Array<DataSourceClass | EntitySchema | string>
  readonly migrations?: Array<DataSourceClass | string>
}
