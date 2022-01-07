import { Get, Post } from '@/common/decorators/request'
import { AppContext } from '@/base/types'
import { Controller } from '@/common/decorators/controller'
import { BaseController } from '@/base/controller'
import { InjectQueue } from '@/common/decorators/injectQueue'
import { Queue } from 'bull'

@Controller('file')
export class FileController extends BaseController {
  @InjectQueue('file') fileQueue: Queue = null
  @Post('upload')
  async upload(ctx: AppContext) {
    this.fileQueue.add('save', {
      folder: ctx.request.body.filename,
      files: [
        ctx.request.files.file,
        // @ts-ignore
        ...(ctx.request.files.files && ctx.request.files.files.length
          ? ctx.request.files.files
          : []),
      ].filter(Boolean),
    })
    ctx.body = {
      status: 0,
    }
  }

  @Get('jobs')
  async getJobs(ctx) {
    ctx.body = {
      jobs: await this.fileQueue.getJobs(['waiting']),
    }
  }
}
