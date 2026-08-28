declare module 'virtual:web-config' {
  export const webConfig: {
    env: 'development' | 'staging' | 'production'
    apiBaseUrl: string
  }
}
