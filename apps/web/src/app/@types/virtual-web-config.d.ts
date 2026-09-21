declare module 'virtual:web-config' {
  export const webConfig: {
    appEnv: 'development' | 'staging' | 'production'
    nodeEnv: 'development' | 'production'
    apiBaseUrl: string
  }
}
