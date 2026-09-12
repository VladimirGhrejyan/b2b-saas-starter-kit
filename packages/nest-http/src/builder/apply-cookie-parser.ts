import type {INestApplication} from '@nestjs/common'
import cookieParser from 'cookie-parser'

/** Enables `req.cookies` for refresh-token cookies. */
export function applyCookieParser(app: INestApplication): void {
  app.use(cookieParser())
}
