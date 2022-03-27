import 'reflect-metadata'
import statusCodes from 'http-status-codes'
import * as request from 'supertest'
import { AppModule } from './app.module'
import AppDataSource, { CustomDataSource } from './database'
import { AuthTestService } from '@/modules/auth/auth.service'
import { addMockObject } from '@/base/module'

describe('App test', () => {
  let app: AppModule
  beforeAll(async () => {
    app = await new AppModule().asApp()
  })

  test('Get hello word', async () => {
    request(app.callback()).get('/').expect(200)
  })

  afterAll(() => {
    app.destroy()
  })
})

describe('App Auth', () => {
  let app: AppModule
  beforeAll(async () => {
    const mockProviderMap = new Map()
    addMockObject(mockProviderMap, AuthTestService)
    app = await new AppModule({ mockProviderMap }).asApp()
  })

  test('Auth Happy Path', async () => {
    const handler = app.callback()
    const db: CustomDataSource = app.resolveDep(AppDataSource)
    await db.queryRunner.startTransaction()
    let resp = await request(handler)
      .post('/auth/account')
      .send({
        username: 'username',
        password: 'password',
      })
      .expect(statusCodes.OK)
    expect(resp.body.user).not.toBeUndefined()

    resp = await request(handler)
      .post('/auth/account/login-status')
      .send({
        username: 'username',
        password: 'password',
      })
      .expect(statusCodes.OK)
    expect(resp.body.accessToken).not.toBeUndefined()
    expect(resp.body.refreshToken).not.toBeUndefined()

    const refreshToken = resp.body.refreshToken
    resp = await request(handler)
      .post('/auth/access-token')
      .set('Authorization', `Bearer ${resp.body.accessToken}`)
      .send({ refreshToken })
      .expect(statusCodes.OK)
    expect(resp.body.accessToken).not.toBeUndefined()

    await request(handler)
      .delete('/auth/account/login-status')
      .set('Authorization', `Bearer ${resp.body.accessToken}`)
      .expect(statusCodes.OK)
    await new Promise((res) => setTimeout(res, 1000))
    resp = await request(handler)
      .post('/auth/access-token')
      .set('Authorization', `Bearer ${resp.body.accessToken}`)
      .send({ refreshToken })
      .expect(statusCodes.UNAUTHORIZED)
    await db.queryRunner.rollbackTransaction()
  })

  afterAll(() => {
    app.destroy()
  })
})
