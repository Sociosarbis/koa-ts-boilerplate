import { Module } from '@/common/decorators/module'
import { BaseModule } from '@/base/module'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'

@Module({
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule extends BaseModule {}
