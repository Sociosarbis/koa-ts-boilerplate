import { BaseModule } from '@/base/module';
import { Module } from '@/common/decorators/module';
import { Middleware } from 'koa';
import * as path from 'path';
import * as sessionMiddlew from 'koa-session-minimal';
import * as corsMiddlew from 'koa-cors';
import viewsMiddlew from '@/common/middlewares/handlebars';
import * as bodyMiddlew from 'koa-body';
import * as jsonMiddlew from 'koa-json';
import * as faviconMiddlew from 'koa-favicon';
import * as staticServerMiddlew from 'koa-static-server';
import * as attachErrorHandler from 'koa-onerror';
import * as morgan from 'morgan';
import expressCompat from '@/utils/expressCompat'
import { AppController } from './app.controller';
import { FileModule } from '@/modules/file/file.module';
import { DownloadModule } from '@/modules/download/download.module';
import { GraphqlModule } from '@/modules/graphql/graphql.module';
import { ProxyModule } from '@/modules/proxy/proxy.module';
import createCustomLogger, { rootLogger } from '@/utils/logger';
import { isProd } from '@/utils/env';

function joinPath(...segments: string[]) {
  return path.join(__dirname, ...segments);
}

const middlewares: Middleware[] = [
  expressCompat(morgan(isProd ? 'combined' : 'dev', {
    stream: isProd ? {
      write: (str) => {
        rootLogger.info(str)
      }
    } : undefined
  })),
  corsMiddlew(),
  sessionMiddlew(),
  faviconMiddlew(joinPath('../assets/static/favicon.ico')),
  staticServerMiddlew({
    rootDir: joinPath('../assets/static'),
    rootPath: '/static',
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
];

@Module({
  imports: [FileModule, GraphqlModule, DownloadModule, ProxyModule],
  controllers: [AppController],
  providers: [createCustomLogger],
})
export class AppModule extends BaseModule {
  constructor() {
    super(null);
    middlewares.forEach((m) => this.use(m));
    attachErrorHandler(this);
  }
}
