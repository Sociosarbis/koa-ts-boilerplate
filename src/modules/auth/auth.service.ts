import AppDataSource, { CustomDataSource, Repository } from '@/database'
import * as jwt from 'jsonwebtoken'
import { authSecretKey } from '@/utils/env'
import * as crypto from 'crypto'
import { User } from '@/dao/user.entity'
import { hashSync } from 'bcryptjs'
import * as dayjs from 'dayjs'
import { Injectable } from '@/common/decorators/injectable'
import { Inject } from '@/common/decorators/inject'
import { Token } from '@/dao/token.entity'
import { QueryRunner } from 'typeorm'

const ACCESS_TOKEN_EXPIRES_IN = '10m'

export const enum AuthErrorMsg {
  USER_ALREADY_EXISTS = 'user already exists',
  USER_NOT_FOUND = 'user not found',
  GENERAL = 'auth error',
}

export class AuthError extends Error {}

@Injectable('AuthService')
export class AuthService {
  #repo: Repository<User>

  #tokenRepo: Repository<Token>

  #db: CustomDataSource

  #queryRunner?: QueryRunner

  constructor(@Inject(AppDataSource) db: CustomDataSource) {
    this.#db = db
    this.#repo = db.getRepository(User)
    this.#tokenRepo = db.getRepository(Token)
  }

  async runInTransaction<T>(operation: (service: this) => Promise<T>) {
    const queryRunner = this.#db.createQueryRunner()
    const { proxy, revoke } = Proxy.revocable(this, {
      get(target, p, receiver) {
        if (p === '#queryRunner') {
          return queryRunner
        } else {
          const value = Reflect.get(target, p)
          if (typeof value === 'function') {
            return value.bind(receiver)
          }
          return value
        }
      },
    })
    try {
      await queryRunner.startTransaction()
      const res = await operation(proxy)
      await queryRunner.commitTransaction()
      return res
    } catch (e) {
      try {
        await queryRunner.rollbackTransaction()
      } catch (e) {}
    } finally {
      queryRunner.release()
      revoke()
    }
  }

  createUserQueryBuilder() {
    return (this.#queryRunner
      ? this.#queryRunner.manager.getRepository(User)
      : this.#repo
    ).createQueryBuilder('user')
  }

  createTokenQueryBuilder() {
    return (this.#queryRunner
      ? this.#queryRunner.manager.getRepository(Token)
      : this.#tokenRepo
    ).createQueryBuilder('token')
  }

  getUserByName(name: string) {
    return this.createUserQueryBuilder()
      .where('user.username = :username', {
        username: name,
      })
      .getOne()
  }

  async createRrefreshToken(userID: number) {
    await this.cancelRefreshToken(userID)
    const token = new Token()
    token.userID = userID
    token.value = crypto.randomBytes(40).toString('hex')
    token.expiresAt = dayjs().add(1, 'day').toDate()
    return Object.assign(
      token,
      (await this.createTokenQueryBuilder().insert().values(token).execute())
        .generatedMaps[0],
    )
  }

  createAccessToken(user: User) {
    return jwt.sign({ id: user.id }, authSecretKey, {
      expiresIn: ACCESS_TOKEN_EXPIRES_IN,
    })
  }

  getRefreshToken(userID: number, value: string) {
    return this.createTokenQueryBuilder()
      .where('token.user_id = :userID', {
        userID,
      })
      .andWhere('token.value = :value', { value })
      .andWhere('token.expires_at > :expiresAt', {
        expiresAt: new Date(),
      })
      .getOne()
  }

  cancelRefreshToken(userID: number, value?: string) {
    const expiresAt = new Date()
    const queryBuilder = this.createTokenQueryBuilder()
      .update()
      .where('token.user_id = :userID', {
        userID,
      })
      .andWhere('token.expires_at > :expiresAt', {
        expiresAt,
      })
      .set({
        expiresAt,
      })
    if (value) {
      queryBuilder.andWhere('token.value = :value', { value })
    }
    return queryBuilder.execute()
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
    const user = new User()
    user.username = username
    user.hashedPassword = hashSync(password, 12)
    return Object.assign(
      user,
      (await this.createUserQueryBuilder().insert().values(user).execute())
        .generatedMaps[0],
    )
  }
}

@Injectable('AuthService')
export class AuthTestService extends AuthService {
  #db: CustomDataSource

  constructor(@Inject(AppDataSource) db: CustomDataSource) {
    super(db)
    this.#db = db
  }

  createUserQueryBuilder() {
    return this.#db.queryRunner.manager.createQueryBuilder(User, 'user')
  }

  createTokenQueryBuiilder() {
    return this.#db.queryRunner.manager.createQueryBuilder(Token, 'token')
  }
}
