import {applyDecorators} from '@nestjs/common'
import {ApiResponse} from '@nestjs/swagger'

import {ErrorOutputDto} from '../dto/error.output'

export function ApiErrorResponses(responses: ReadonlyArray<{readonly status: number; readonly description: string}>) {
  return applyDecorators(
    ...responses.map(({status, description}) =>
      ApiResponse({
        status,
        description,
        type: ErrorOutputDto.Output,
      }),
    ),
  )
}
