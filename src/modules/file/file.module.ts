import * as Queue from 'bull';
import { Module } from '@/common/decorators/module';
import { BaseModule } from '@/base/module';
import { FileController } from './file.controller';
import { FileProcessor } from './file.processor';
import makeClassFactory from '@/common/makeClassFactory';

@Module({
  providers: [
    makeClassFactory(Queue, 'file', 'redis://172.22.9.101:6379'),
    FileProcessor,
  ],
  controllers: [new FileController()],
})
export class FileModule extends BaseModule {}
