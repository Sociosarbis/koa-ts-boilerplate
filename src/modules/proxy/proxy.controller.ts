import { Controller } from '@/common/decorators/controller'
import { BaseController } from '@/base/controller'
import { AppContext } from '@/base/types'
import { Get } from '@/common/decorators/request'
import { ProxyService } from './proxy.service'
import { Inject } from '@/common/decorators/inject'
import createCustomLogger, { CustomLogger } from '@/utils/logger'

@Controller('proxy')
export class ProxyController extends BaseController {
  constructor(
    private proxyService: ProxyService,
    @Inject(createCustomLogger) private logger: CustomLogger,
  ) {
    super()
  }
  @Get('resource/(.*)')
  async getResource(ctx: AppContext) {
    const path = ctx.path.replace('/proxy/resource', '')
    try {
      await this.proxyService.proxyWeb(ctx.req, ctx.res, {
        target: `http://www.baidu.com${path}`,
      })
      this.logger.info('proxy finished: %s%s', 'http://www.baidu.com', path)
    } catch (e) {
      this.logger.error(
        'proxy failed: %s%s due to %s',
        'http://www.baidu.com',
        path,
        e?.message,
      )
    }
  }
}
