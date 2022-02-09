import { AppService } from './app.service'
import { Get, Post, Put } from '@/common/decorators/request'
import Compose from '@/common/decorators/compose'
import jwtMiddlew, { sign } from '@/common/middlewares/jwt'
import { Controller } from '@/common/decorators/controller'
import { BaseController } from '@/base/controller'
import { AppContext } from '@/base/types'
import { mkdir } from '@/utils/io'
import { File } from 'formidable'
import { joinSafe } from 'upath'
import { uploadResourceRoot } from '@/utils/env'

@Controller()
export class AppController extends BaseController {
  constructor(private appService: AppService) {
    super()
  }
  @Get()
  async getHello(ctx: AppContext) {
    ctx.session.helloCount = ctx.session.helloCount || 0
    ctx.session.helloCount++
    await ctx.render('index', {
      title: 'Ekwing',
      greeting: this.appService.getHello(),
      views: ctx.session.helloCount,
    })
  }

  @Get('cats')
  async getCats(ctx: AppContext) {
    ctx.session.catsCount = ctx.session.catsCount || 0
    ctx.session.catsCount++
    await ctx.render('index', {
      title: 'Mia, Abby and Lulu.',
      greeting: 'Hey',
      views: ctx.session.catsCount,
    })
  }

  @Get('cat/:cat')
  @Compose([jwtMiddlew])
  async getCat(ctx: AppContext) {
    ctx.session.catCount = ctx.session.catCount || 0
    ctx.session.catCount++
    await ctx.render('index', {
      title: ctx.params.cat,
      greeting: 'Found a cat',
      views: ctx.session.catCount,
    })
  }

  @Post('login')
  async login(ctx: AppContext) {
    ctx.body = {
      token: sign({
        username: 'sociosarbis',
      }),
    }
  }

  @Get('uploads/:hash/progress')
  async getUploadProgress(ctx: AppContext) {
    const { hash }: { hash: string } = ctx.params
    ctx.body = {
      status: 0,
      data: {
        progress: await this.appService
          .listFileStats(joinSafe(uploadResourceRoot, hash))
          .then((list) =>
            list.reduce((acc, item) => {
              const { index } = this.appService.getNameAndIndex(item.name)
              acc[index] = item.stat.size
              return acc
            }, {} as { [i: number]: number }),
          ),
      },
    }
  }

  @Put('uploadSlice')
  async uploadSlice(ctx: AppContext) {
    const [name] = ctx.request.body.name.split('_')
    await this.appService.copyFile(
      (ctx.request.files.data as File).path,
      joinSafe(uploadResourceRoot, name, ctx.request.body.name),
    )
    ctx.body = { status: 0 }
  }

  @Post('mergeFile')
  async mergeFile(ctx: AppContext) {
    const { hash, name } = ctx.request.body
    try {
      const stats = await this.appService.listFileStats(
        joinSafe(uploadResourceRoot, hash),
      )
      await Promise.all(
        stats.map((item) => {
          if (item.stat.isFile()) {
            const { index } = this.appService.getNameAndIndex(item.name)
            if (!isNaN(index)) {
              return mkdir(joinSafe(uploadResourceRoot, 'output'), {
                recursive: true,
              }).then(() =>
                this.appService.writeFileSegment(
                  joinSafe(uploadResourceRoot, hash, item.name),
                  joinSafe(uploadResourceRoot, 'output', name),
                  1e6 * index,
                ),
              )
            }
          }
        }),
      )
      ctx.body = {
        status: 0,
      }
    } catch (e) {
      ctx.body = {
        status: 1,
        msg: e.message,
      }
    }
  }
}
