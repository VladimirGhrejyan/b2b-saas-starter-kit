declare module 'virtual:admin-config' {
  export const adminConfig: {
    appEnv: 'development' | 'staging' | 'production'
    nodeEnv: 'development' | 'production'
    apiBaseUrl: string
  }
}
