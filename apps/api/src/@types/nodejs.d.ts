declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV?: string
      PORT?: string
      DATABASE_URL?: string
      REDIS_URL?: string
      JWT_ACCESS_SECRET?: string
      SWAGGER_BASIC_AUTH_PASSWORD?: string
      MAIL_PASS?: string
      MAIL_API_KEY?: string
      CONFIG_DIR?: string
      CONFIG_OVERLAY?: string
    }
  }
}

export {}
