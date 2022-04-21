import statusCodes from 'http-status-codes'
import { Controller } from '@/common/decorators/controller'
import { BaseController } from '@/base/controller'
import { Post, Del } from '@/common/decorators/request'
import Compose from '@/common/decorators/compose'
import * as jwtMiddleware from 'koa-jwt'
import { authSecretKey } from '@/utils/env'
import { msgResponse } from '@/common/responses/msg'
import { AppContext } from '@/base/types'
import { AuthService, AuthError, AuthErrorMsg } from './auth.service'
import { compareSync } from 'bcryptjs'
import { User } from '@/dao/user.entity'
import { Inject } from '@/common/decorators/inject'

@Controller('auth')
export class AuthController extends BaseController {
  constructor(@Inject('AuthService') private service: AuthService) {
    super()
  }

  checkUserID(ctx: AppContext) {
    const { id }: { id: number } = ctx.state.account
    if (isNaN(id)) {
      ctx.throw(statusCodes.UNAUTHORIZED, 'invalid accessToken')
    }
    return id
  }

  checkRefreshToken(ctx: AppContext) {
    const { refreshToken }: { refreshToken: string } = ctx.request.body

    if (!refreshToken) {
      ctx.throw(statusCodes.BAD_REQUEST, 'no refreshToken')
    }
    return refreshToken
  }

  @Post('account')
  async signUp(ctx: AppContext) {
    const {
      username,
      password,
    }: { username: string; password: string } = ctx.request.body
    try {
      const user = await this.service.runInTransaction((s) => {
        return s.createUser({ username, password })
      })
      ctx.body = {
        user,
      }
    } catch (e) {
      if (e instanceof AuthError) {
        if (e.message === AuthErrorMsg.USER_ALREADY_EXISTS) {
          ctx.throw(statusCodes.BAD_REQUEST, e.message)
        }
      }
      ctx.throw(statusCodes.INTERNAL_SERVER_ERROR, e.message)
    }
  }

  @Post('account/login-status')
  async login(ctx: AppContext) {
    const {
      username,
      password,
    }: { username: string; password: string } = ctx.request.body
    if (!username) {
      ctx.throw(statusCodes.BAD_REQUEST, 'invalid username')
    }
    const user = await this.service.getUserByName(username)
    if (!user) {
      ctx.throw(statusCodes.BAD_REQUEST, AuthErrorMsg.USER_NOT_FOUND)
    }
    if (!compareSync(password, user.hashedPassword)) {
      ctx.throw(statusCodes.UNAUTHORIZED, AuthErrorMsg.GENERAL)
    }
    ctx.body = {
      accessToken: this.service.createAccessToken(user),
      refreshToken: (
        await this.service.runInTransaction((s) =>
          s.createRrefreshToken(user.id),
        )
      ).value,
    }
  }

  @Post('/access-token')
  @Compose([
    jwtMiddleware({
      secret: authSecretKey,
      key: 'account',
      // @ts-ignore
      ignoreExpiration: true,
    }),
  ])
  async refreshAccessToken(ctx: AppContext) {
    const [id, refreshToken] = [
      this.checkUserID(ctx),
      this.checkRefreshToken(ctx),
    ]
    if (!(await this.service.getRefreshToken(id, refreshToken))) {
      ctx.throw(statusCodes.UNAUTHORIZED, 'refreshToken is not valid')
    }
    const user = new User()
    user.id = id
    ctx.body = {
      accessToken: this.service.createAccessToken(user),
    }
  }

  @Del('account/login-status')
  @Compose([jwtMiddleware({ secret: authSecretKey, key: 'account' })])
  async logout(ctx: AppContext) {
    const id = this.checkUserID(ctx)
    await this.service.runInTransaction((s) => s.cancelRefreshToken(id))
    ctx.body = msgResponse('ok')
  }
}
