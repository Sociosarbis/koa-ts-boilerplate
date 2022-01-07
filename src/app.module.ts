import { BaseModule } from '@/base/module'
import { Module } from '@/common/decorators/module'
import { Middleware } from 'koa'
import { joinSafe as join, basename } from 'upath'
import * as contentComposition from 'content-disposition'
import * as sessionMiddlew from 'koa-session-minimal'
import * as corsMiddlew from 'koa-cors'
import viewsMiddlew from '@/common/middlewares/handlebars'
import * as bodyMiddlew from 'koa-body'
import * as jsonMiddlew from 'koa-json'
import * as faviconMiddlew from 'koa-favicon'
import * as staticServerMiddlew from 'koa-static-server'
import * as attachErrorHandler from 'koa-onerror'
import * as morgan from 'morgan'
import expressCompat from '@/utils/expressCompat'
import { AppController } from './app.controller'
import { FileModule } from '@/modules/file/file.module'
import { GraphqlModule } from '@/modules/graphql/graphql.module'
import { ProxyModule } from '@/modules/proxy/proxy.module'
import createCustomLogger, { rootLogger } from '@/utils/logger'
import { isProd, serverRoot, downloadsRoot } from '@/utils/env'

const middlewares: Middleware[] = [
  expressCompat(
    morgan(isProd ? 'combined' : 'dev', {
      stream: isProd
        ? {
            write: (str) => {
              rootLogger.info(str)
            },
          }
        : undefined,
    }),
  ),
  corsMiddlew(),
  sessionMiddlew(),
  faviconMiddlew(join(serverRoot, 'assets/static/favicon.ico')),
  staticServerMiddlew({
    rootDir: join(serverRoot, 'assets/static'),
    rootPath: '/static',
  }),
  staticServerMiddlew({
    rootDir: downloadsRoot,
    rootPath: '/downloads',
    // @ts-ignore
    setHeaders: (res: ServerResponse, path: string) => {
      res.setHeader('Content-Disposition', contentComposition(basename(path)))
    },
  }),
  bodyMiddlew({
    multipart: true,
    formidable: {
      maxFileSize: 20000 * 1024 * 1024,
    },
    formLimit: '20mb',
    jsonLimit: '20mb',
    textLimit: '20mb',
  }),
  jsonMiddlew(),
  viewsMiddlew({}),
]

@Module({
  imports: [FileModule, GraphqlModule, ProxyModule],
  controllers: [AppController],
  providers: [createCustomLogger],
})
export class AppModule extends BaseModule {
  constructor() {
    super(null)
    middlewares.forEach((m) => this.use(m))
    attachErrorHandler(this)
  }
}
