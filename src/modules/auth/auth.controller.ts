import statusCodes from 'http-status-codes'
import { Controller } from '@/common/decorators/controller'
import { BaseController } from '@/base/controller'
import { Post } from '@/common/decorators/request'
import jwt from 'jsonwebtoken'
import { authSecretKey } from '@/utils/env'
import { errorResponse } from '@/common/responses/error'
import { AppContext } from '@/base/types'
import { AuthService, AuthError, AuthErrorMsg } from './auth.service'
import { compareSync } from 'bcryptjs'

const ACCESS_TOKEN_EXPIRES_IN = '10m'

@Controller('auth')
export class AuthController extends BaseController {
  constructor(private service: AuthService) {
    super()
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
          ctx.throw(statusCodes.BAD_REQUEST, errorResponse(e))
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
    const user = await this.service.getUserByName(username)
    if (!user) {
      ctx.throw(
        statusCodes.BAD_REQUEST,
        errorResponse(AuthErrorMsg.USER_NOT_FOUND),
      )
    }
    if (!compareSync(password, user.hashedPassword)) {
      ctx.throw(statusCodes.UNAUTHORIZED, errorResponse(AuthErrorMsg.GENERAL))
    }
    ctx.body = {
      accessToken: jwt.sign({ id: user.id }, authSecretKey, {
        expiresIn: ACCESS_TOKEN_EXPIRES_IN,
      }),
      refreshToken: this.service.createRrefreshToken(user.id),
    }
  }
}
