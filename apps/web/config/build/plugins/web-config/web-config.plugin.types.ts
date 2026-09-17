export type BakedWebConfig = {
  apiBaseUrl: string
}

export type ConfigLoaderPackage = {
  ConfigLoader: {
    load: (schema: unknown, options: {source: 'yaml'; directory: string; files?: string[]}) => BakedWebConfig
  }
}

export type WebConfigSchemaPackage = {
  webConfigSchema: unknown
}
