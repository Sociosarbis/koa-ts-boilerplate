import { extname, basename } from 'path';
import { Get } from '@/common/decorators/request';
import { AppContext } from '@/base/types';
import { Controller } from '@/common/decorators/controller';
import { BaseController } from '@/base/controller';
import { Inject } from '@/common/decorators/inject';
import { DownloadService } from './download.service';

@Controller('downloads')
export class DownloadController extends BaseController {
  @Inject(DownloadService)
  downloadService: DownloadService = null;
  @Get(':filename')
  async download(ctx: AppContext) {
    const filename: string = ctx.params.filename;
    try {
      ctx.body = await this.downloadService.requestFile(filename);
      ctx.attachment(basename(filename));
      ctx.type = extname(filename);
      return;
    } catch (e) {}
    ctx.status = 404;
  }
}
