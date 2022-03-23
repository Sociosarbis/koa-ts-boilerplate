import { Module } from '@/common/decorators/module'
import { BaseModule } from '@/base/module'
import { AuthController } from './auth.controller'

@Module({
  controllers: [AuthController],
})
export class AuthModule extends BaseModule {}
