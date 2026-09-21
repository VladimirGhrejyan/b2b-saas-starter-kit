import {Global, Module} from '@nestjs/common'

import {FILE_STORAGE} from '@b2b-saas-starter-kit/platform'

import {InMemoryFileStorage} from '@b2b-saas-starter-kit/application'

/**
 * Binds {@link FILE_STORAGE} to the in-memory stub until an S3-compatible adapter exists.
 */
@Global()
@Module({
  providers: [InMemoryFileStorage, {provide: FILE_STORAGE, useExisting: InMemoryFileStorage}],
  exports: [FILE_STORAGE, InMemoryFileStorage],
})
export class FileStorageModule {}
