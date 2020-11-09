import { Context } from 'koa';
import * as Router from 'koa-router';
import { AppService } from './app.service';

export class AppController {
  private readonly router = new Router();
  private readonly appService = new AppService();
  constructor() {
    this.router.get('/', this.getHello);
  }

  getHello = async (ctx: Context & Router.RouterContext) => {
    await ctx.render('index', {
      title: 'Ekwing',
      greeting: this.appService.getHello(),
    });
  };

  middleware() {
    return this.router.routes();
  }
}
