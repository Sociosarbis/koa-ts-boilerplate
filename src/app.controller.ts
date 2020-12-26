import appService from './app.service';
import { Get, Post, Put } from '@/common/decorators/request';
import Compose from '@/common/decorators/compose';
import jwtMiddlew, { sign } from '@/common/middlewares/jwt';
import { Controller } from '@/common/decorators/controller';
import { BaseController } from '@/base/controller';
import { AppContext } from '@/base/types';
import { createReadStream, createWriteStream } from 'fs';
import { mkdir, stat } from '@/utils/io';

@Controller()
export class AppController extends BaseController {
  @Get()
  async getHello(ctx: AppContext) {
    ctx.session.helloCount = ctx.session.helloCount || 0;
    ctx.session.helloCount++;
    await ctx.render('index', {
      title: 'Ekwing',
      greeting: appService.getHello(),
      views: ctx.session.helloCount,
    });
  }

  @Get('cats')
  async getCats(ctx: AppContext) {
    ctx.session.catsCount = ctx.session.catsCount || 0;
    ctx.session.catsCount++;
    await ctx.render('index', {
      title: 'Mia, Abby and Lulu.',
      greeting: 'Hey',
      views: ctx.session.catsCount,
    });
  }

  @Get('cat/:cat')
  @Compose([jwtMiddlew])
  async getCat(ctx: AppContext) {
    ctx.session.catCount = ctx.session.catCount || 0;
    ctx.session.catCount++;
    await ctx.render('index', {
      title: ctx.params.cat,
      greeting: 'Found a cat',
      views: ctx.session.catCount,
    });
  }

  @Post('login')
  async login(ctx: AppContext) {
    ctx.body = {
      token: sign({
        username: 'sociosarbis',
      }),
    };
  }

  @Put('uploadSlice')
  async uploadSlice(ctx: AppContext) {
    const [name] = ctx.request.body.name.split('_');
    const stats = await stat(`./resource/${name}`);
    if (!stats.isDirectory()) {
      await mkdir(`./resource/${name}`, { recursive: true });
    }
    const writable = createWriteStream(
      `./resource/${name}/${ctx.request.body.name}`,
    );
    createReadStream(ctx.request.files.data.path).pipe(writable);
    ctx.body = await new Promise((res) => {
      writable.on('finish', () => {
        res({ status: 0 });
      });
    });
  }
}
