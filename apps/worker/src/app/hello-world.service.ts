import {Injectable, Logger, type OnModuleInit} from '@nestjs/common'

@Injectable()
export class HelloWorldService implements OnModuleInit {
  private readonly logger = new Logger(HelloWorldService.name)

  hello() {
    return {message: 'Hello World', app: 'worker'} as const
  }

  onModuleInit() {
    const payload = this.hello()

    this.logger.log(`${payload.message} (${payload.app})`)
  }
}
