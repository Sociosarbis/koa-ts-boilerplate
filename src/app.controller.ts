import appService from './app.service';
import { Get } from '@/common/decorators/request';
import { Controller } from '@/common/decorators/controller';
import { BaseController } from '@/base/controller';
import { AppContext } from '@/base/types';

@Controller()
export class AppController extends BaseController {
  @Get()
  async getHello(ctx: AppContext) {
    await ctx.render('index', {
      title: 'Ekwing',
      greeting: appService.getHello(),
    });
  }

  @Get('cats')
  async getCats(ctx: AppContext) {
    await ctx.render('index', {
      title: 'Mia, Abby and Lulu.',
      greeting: 'Hey',
    });
  }

  @Get('cat/:cat')
  async getCat(ctx: AppContext) {
    await ctx.render('index', {
      title: ctx.params.cat,
      greeting: 'Found a cat',
    });
  }
}
