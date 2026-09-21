import type {OnModuleInit} from '@nestjs/common'
import {Inject, Injectable} from '@nestjs/common'

import {CreateUserUseCase} from '@b2b-saas-starter-kit/composition'

import type {ApiConfig} from '../config/api-config.schema'
import {API_CONFIG} from '../config/api-config.token'

/**
 * Idempotent local user for `nx serve api`. Does not run in production.
 */
@Injectable()
export class DevSeeder implements OnModuleInit {
  constructor(
    private readonly createUser: CreateUserUseCase,
    @Inject(API_CONFIG) private readonly config: ApiConfig,
  ) {}

  async onModuleInit(): Promise<void> {
    if (this.config.nodeEnv !== 'development') {
      return
    }

    try {
      await this.createUser.execute({email: 'dev@example.com', displayName: 'Dev'})
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
