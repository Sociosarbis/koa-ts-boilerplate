import AppDataSource, { CustomDataSource, Repository } from '@/database'
import crypto from 'crypto'
import { User } from '@/dao/user.entity'
import { hashSync } from 'bcryptjs'
import dayjs from 'dayjs'
import { Injectable } from '@/common/decorators/injectable'
import { Inject } from '@/common/decorators/inject'
import { Token } from '@/dao/token.entity'

export const enum AuthErrorMsg {
  USER_ALREADY_EXISTS = 'user already exists',
  USER_NOT_FOUND = 'user not found',
  GENERAL = 'auth error',
}

export class AuthError extends Error {}

@Injectable()
export class AuthService {
  #repo: Repository<User>

  #tokenRepo: Repository<Token>

  constructor(@Inject(AppDataSource) db: CustomDataSource) {
    this.#repo = db.getRepository(User)
    this.#tokenRepo = db.getRepository(Token)
  }

  getUserByName(name: string) {
    return this.#repo
      .createQueryBuilder('user')
      .where('user.username = :username', {
        username: name,
      })
      .getOne()
  }

  async createRrefreshToken(userID: number) {
    const now = new Date()
    let token = await this.#tokenRepo
      .createQueryBuilder('token')
      .where('token.userID = :userID', {
        userID,
      })
      .andWhere('token.expiresAt > :expiresAt', {
        expiresAt: now,
      })
      .getOne()
    if (token) {
      await this.cancelRefreshToken(token, now)
    }
    token = new Token()
    token.userID = userID
    token.value = crypto.randomBytes(40).toString('hex')
    token.expiresAt = dayjs().add(1, 'day').toDate()
    token = await this.#tokenRepo
      .createQueryBuilder('token')
      .insert()
      .values(token)
      .execute()[0]
    return token
  }

  cancelRefreshToken(token: Token, expiresAt?: Date) {
    expiresAt = expiresAt ?? new Date()
    return this.#tokenRepo
      .createQueryBuilder('token')
      .update()
      .set({
        expiresAt,
      })
      .where('id = :id', {
        id: token.id,
      })
      .execute()
  }

  async createUser({
    username,
    password,
  }: {
    username: string
    password: string
  }) {
    const existUser = await this.getUserByName(username)
    if (existUser) {
      throw new AuthError(AuthErrorMsg.USER_ALREADY_EXISTS)
    }
    let user = new User()
    user.username = username
    user.hashedPassword = hashSync(password, 12)
    user = await this.#repo
      .createQueryBuilder()
      .insert()
      .values(user)
      .execute()[0]
    return user
  }
}
