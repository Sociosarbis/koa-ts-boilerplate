import appService from './app.service';
import { Get, Post } from '@/common/decorators/request';
import Compose from '@/common/decorators/compose';
import jwtMiddlew, { sign } from '@/common/middlewares/jwt';
import * as fs from 'fs';
import { promisify } from 'util';
import { Controller } from '@/common/decorators/controller';
import { BaseController } from '@/base/controller';
import { AppContext } from '@/base/types';

const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);
const readFile = promisify(fs.readFile);

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
}
