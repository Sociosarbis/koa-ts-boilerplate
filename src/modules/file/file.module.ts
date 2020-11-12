import * as Queue from 'bull';
import { Module } from '@/common/decorators/module';
import { BaseModule } from '@/base/module';
import { FileController } from './file.controller';
import { FileProcessor } from './file.processor';

@Module({
  providers: [new Queue('file'), new FileProcessor()],
  controllers: [new FileController()],
})
export class FileModule extends BaseModule {}
