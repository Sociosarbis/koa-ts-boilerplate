import { Module } from '@/common/decorators/module';
import { BaseModule } from '@/base/module';
import { ProxyController } from './proxy.controller';
import { ProxyService } from './proxy.service';

@Module({
  providers: [ProxyService],
  controllers: [new ProxyController()],
})
export class ProxyModule extends BaseModule {}
