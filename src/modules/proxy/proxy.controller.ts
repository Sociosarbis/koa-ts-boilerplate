import { Controller } from '@/common/decorators/controller';
import { BaseController } from '@/base/controller';
import { AppContext } from '@/base/types';
import { Get } from '@/common/decorators/request';
import { ProxyService } from './proxy.service';
import { Inject } from '@/common/decorators/inject';

@Controller('proxy')
export class ProxyController extends BaseController {
  @Inject(ProxyService)
  proxyService: ProxyService = null;
  @Get('resource/(.*)')
  async getResource(ctx: AppContext) {
    const path = ctx.path.replace('/proxy/resource', '');
    await this.proxyService.proxyWeb(ctx.req, ctx.res, {
      target: `http://www.baidu.com${path}`,
    });
  }
}
