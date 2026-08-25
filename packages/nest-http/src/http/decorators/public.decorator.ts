import {SetMetadata} from '@nestjs/common'

import {IS_PUBLIC_KEY} from './is-public-key'

export function Public() {
  return SetMetadata(IS_PUBLIC_KEY, true)
}
