declare module 'virtual:admin-config' {
  export const adminConfig: {
    env: 'development' | 'staging' | 'production'
    apiBaseUrl: string
  }
}
