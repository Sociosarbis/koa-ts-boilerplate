import { AppService } from './app.service'
import { Get, Post, Put } from '@/common/decorators/request'
import Compose from '@/common/decorators/compose'
import jwtMiddlew, { sign } from '@/common/middlewares/jwt'
import { Controller } from '@/common/decorators/controller'
import { BaseController } from '@/base/controller'
import { AppContext } from '@/base/types'
import { createReadStream, createWriteStream } from 'fs'
import { mkdir, stat, readdir } from '@/utils/io'
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
    const stats = await stat(joinSafe(uploadResourceRoot, hash))
    const body = {
      status: 0,
      data: {
        progress: {} as { [i: number]: number },
      },
    }
    if (stats && stats.isDirectory()) {
      const segments = await readdir(joinSafe(uploadResourceRoot, hash))
      ;(
        await Promise.all(
          segments.map((f) => stat(joinSafe(uploadResourceRoot, hash, f))),
        )
      )
        .map((stat, i) => ({ name: segments[i], stat }))
        .filter(({ stat }) => stat.isFile())
        .reduce((acc, item) => {
          const { index } = this.appService.getNameAndIndex(item.name)
          acc[index] = item.stat.size
          return acc
        }, body.data.progress)
    }
    ctx.body = body
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
    const stats = await stat(joinSafe(uploadResourceRoot, hash))
    if (stats && stats.isDirectory()) {
      try {
        await Promise.all(
          (await readdir(joinSafe(uploadResourceRoot, hash))).map(async (f) => {
            const stats = await stat(joinSafe(uploadResourceRoot, hash, f))
            if (stats && stats.isFile()) {
              const [_, i] = f.split('_')
              if (!isNaN(Number(i))) {
                await mkdir(joinSafe(uploadResourceRoot, 'output'), {
                  recursive: true,
                })
                await new Promise((res, rej) => {
                  createReadStream(joinSafe(uploadResourceRoot, hash, f)).pipe(
                    createWriteStream(
                      joinSafe(uploadResourceRoot, 'output', name),
                      {
                        start: 1e6 * Number(i),
                      },
                    )
                      .on('finish', res)
                      .on('error', rej) as any,
                  )
                })
              }
            }
          }),
        )
        ctx.body = {
          status: 0,
        }
        return
      } catch (e) {
        //
      }
    }
    ctx.body = {
      status: 1,
    }
  }
}
