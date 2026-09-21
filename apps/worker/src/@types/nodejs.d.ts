declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV?: string
      DATABASE_URL?: string
      REDIS_URL?: string
      MAIL_PASS?: string
      MAIL_API_KEY?: string
      CONFIG_DIR?: string
      CONFIG_OVERLAY?: string
    }
  }
}

export {}
