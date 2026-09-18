import {Global, Module} from '@nestjs/common'

import {PASSWORD_HASHER, TOKEN_DIGEST} from '@b2b-saas-starter-kit/platform'

import {Argon2PasswordHasher} from './password-hasher/argon2-password-hasher'
import {Sha256TokenDigest} from './token-digest/sha256-token-digest'

/**
 * Nest wrapper around Argon2id hashing and SHA-256 token digest.
 */
@Global()
@Module({
  providers: [
    Argon2PasswordHasher,
    {
      provide: PASSWORD_HASHER,
      useExisting: Argon2PasswordHasher,
    },
    Sha256TokenDigest,
    {
      provide: TOKEN_DIGEST,
      useExisting: Sha256TokenDigest,
    },
  ],
  exports: [Argon2PasswordHasher, PASSWORD_HASHER, Sha256TokenDigest, TOKEN_DIGEST],
})
export class SecurityModule {}
