import {HttpStatus} from '@b2b-saas-starter-kit/contracts'

/** Application error `code` → HTTP status. Unmapped codes default to 409 in the kit filter. */
export const codedErrorHttpStatuses: Readonly<Record<string, number>> = {
  INSUFFICIENT_PERMISSION: HttpStatus.FORBIDDEN,
  USER_NOT_FOUND: HttpStatus.NOT_FOUND,
  OWNER_USER_NOT_FOUND: HttpStatus.NOT_FOUND,
  USER_EMAIL_TAKEN: HttpStatus.CONFLICT,
}
