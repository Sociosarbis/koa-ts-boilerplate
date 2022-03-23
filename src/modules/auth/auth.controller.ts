import { Controller } from '@/common/decorators/controller'
import { BaseController } from '@/base/controller'
import AppDataSource, { CustomDataSource } from '@/database'
import { Inject } from '@/common/decorators/inject'
import { Post } from '@/common/decorators/request'
import { AppContext } from '@/base/types'
import { hashSync } from 'bcryptjs'
import { User } from '@/dao/user.entity'

@Controller('auth')
export class AuthController extends BaseController {
  @Inject(AppDataSource)
  datasource: CustomDataSource

  @Post('account')
  async signUp(ctx: AppContext) {
    const {
      username,
      password,
    }: { username: string; password: string } = ctx.request.body
    const userRepo = this.datasource.getRepository(User)
    const user = new User()
    user.username = username
    user.hashedPassword = hashSync(password, 12)
    await userRepo.save(user)
  }
}
