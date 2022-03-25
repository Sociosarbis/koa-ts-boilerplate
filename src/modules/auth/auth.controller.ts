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

@Controller('auth')
export class AuthController extends BaseController {
  constructor(private service: AuthService) {
    super()
  }

  checkRefreshToken(ctx: AppContext) {
    const { id }: { id: number } = ctx.state.account
    const { refreshToken }: { refreshToken: string } = ctx.request.body
    if (isNaN(id)) {
      ctx.throw(statusCodes.UNAUTHORIZED, msgResponse('invalid accessToken'))
    }

    if (!refreshToken) {
      ctx.throw(statusCodes.BAD_REQUEST, msgResponse('no refreshToken'))
    }
    return { id, refreshToken }
  }

  @Post('account')
  async signUp(ctx: AppContext) {
    const {
      username,
      password,
    }: { username: string; password: string } = ctx.request.body
    try {
      const user = await this.service.createUser({ username, password })
      ctx.body = {
        user,
      }
    } catch (e) {
      if (e instanceof AuthError) {
        if (e.message === AuthErrorMsg.USER_ALREADY_EXISTS) {
          ctx.throw(statusCodes.BAD_REQUEST, msgResponse(e))
        }
      }
      ctx.throw()
    }
  }

  @Post('account/login-status')
  async login(ctx: AppContext) {
    const {
      username,
      password,
    }: { username: string; password: string } = ctx.request.body
    if (!username) {
      ctx.throw(statusCodes.BAD_REQUEST, msgResponse('invalid username'))
    }
    const user = await this.service.getUserByName(username)
    if (!user) {
      ctx.throw(
        statusCodes.BAD_REQUEST,
        msgResponse(AuthErrorMsg.USER_NOT_FOUND),
      )
    }
    if (!compareSync(password, user.hashedPassword)) {
      ctx.throw(statusCodes.UNAUTHORIZED, msgResponse(AuthErrorMsg.GENERAL))
    }
    ctx.body = {
      accessToken: this.service.createAccessToken(user),
      refreshToken: this.service.createRrefreshToken(user.id),
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
    const { id, refreshToken } = this.checkRefreshToken(ctx)
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
    const { id, refreshToken } = this.checkRefreshToken(ctx)
    await this.service.cancelRefreshToken(id, refreshToken)
    ctx.body = msgResponse('ok')
  }
}
