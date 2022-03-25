import * as Queue from 'bull'
import { Module } from '@/common/decorators/module'
import { BaseModule } from '@/base/module'
import { FileController } from './file.controller'
import { FileProcessor } from './file.processor'
import { markClassFactory } from '@/common/makeClassFactory'
import { OnModuleDestroy } from '@/common/hooks'

class CustomQueue extends Queue implements OnModuleDestroy {
  static forRoot(queueName: string, url: string) {
    return markClassFactory(() => {
      const queue = new CustomQueue(queueName, url)
      return queue.isReady().then(() => queue)
    }, 'queue')
  }

  onModuleDestroy() {
    this.close()
  }
}

@Module({
  providers: [
    CustomQueue.forRoot('file', 'redis://172.22.9.101:6379'),
    FileProcessor,
  ],
  controllers: [FileController],
})
export class FileModule extends BaseModule {}
