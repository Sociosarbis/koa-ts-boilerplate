import { Module } from '@/common/decorators/module';
import { BaseModule } from '@/base/module';
import { DownloadController } from './download.controller';
import { DownloadService } from './download.service';

@Module({
  providers: [DownloadService],
  controllers: [new DownloadController()],
})
export class DownloadModule extends BaseModule {}
