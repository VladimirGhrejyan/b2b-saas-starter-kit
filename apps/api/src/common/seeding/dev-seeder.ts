import type {OnModuleInit} from '@nestjs/common'
import {Injectable} from '@nestjs/common'

import {CreateUserUseCase} from '@b2b-saas-starter-kit/composition'

/**
 * Idempotent local user for `nx serve api`. Does not run in test/production.
 */
@Injectable()
export class DevSeeder implements OnModuleInit {
  constructor(private readonly createUser: CreateUserUseCase) {}

  async onModuleInit(): Promise<void> {
    if (process.env.NODE_ENV !== 'development') {
      return
    }

    try {
      await this.createUser.execute({email: 'dev@localhost', displayName: 'Dev'})
    } catch (error) {
      if (this.isEmailTaken(error)) {
        return
      }

      throw error
    }
  }

  private isEmailTaken(error: unknown): boolean {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === 'USER_EMAIL_TAKEN'
  }
}
