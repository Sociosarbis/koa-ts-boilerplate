import appService from './app.service';
import { Get, Post, Put } from '@/common/decorators/request';
import Compose from '@/common/decorators/compose';
import jwtMiddlew, { sign } from '@/common/middlewares/jwt';
import { Controller } from '@/common/decorators/controller';
import { BaseController } from '@/base/controller';
import { AppContext } from '@/base/types';
import { createReadStream, createWriteStream, WriteStream } from 'fs';
import { mkdir, stat, readdir } from '@/utils/io';
import { File } from 'formidable';

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
    await appService.copyFile(
      (ctx.request.files.data as File).path,
      `./resource/${name}/${ctx.request.body.name}`,
    );
    ctx.body = { status: 0 };
  }

  @Post('mergeFile')
  async mergeFile(ctx: AppContext) {
    const { hash, name } = ctx.request.body;
    const stats = await stat(`./resource/${hash}`);
    if (stats && stats.isDirectory()) {
      try {
        await Promise.all(
          (await readdir(`./resource/${hash}`)).map(async (f) => {
            const stats = await stat(`./resource/${hash}/${f}`);
            if (stats && stats.isFile()) {
              const [_, i] = f.split('_');
              if (!isNaN(Number(i))) {
                await mkdir(`./resource/output`, { recursive: true });
                await new Promise((res, rej) => {
                  createReadStream(`./resource/${hash}/${f}`).pipe(
                    createWriteStream(`./resource/output/${name}`, {
                      start: 1e6 * Number(i),
                    })
                      .on('finish', res)
                      .on('error', rej) as any,
                  );
                });
              }
            }
          }),
        );
        ctx.body = {
          status: 0,
        };
        return;
      } catch (e) {
        //
      }
    }
    ctx.body = {
      status: 1,
    };
  }
}
