import * as Koa from 'koa';
import * as path from 'path';
import * as loggerMiddlew from 'koa-logger';
import * as viewsMiddlew from 'koa-views';
import * as bodyMiddlew from 'koa-body';
import * as jsonMiddlew from 'koa-json';
import * as faviconMiddlew from 'koa-favicon';
import * as staticServerMiddlew from 'koa-static-server';
import * as attachErrorHandler from 'koa-onerror';
import { AppController } from './app.controller';

function joinPath(...segments: string[]) {
  return path.join(__dirname, ...segments);
}

const middlewares: Koa.Middleware[] = [
  loggerMiddlew(),
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
  viewsMiddlew(joinPath('../assets/views'), { extension: 'ejs' }),
  new AppController().middleware(),
];

export class AppModule extends Koa {
  constructor() {
    super();
    middlewares.forEach((m) => this.use(m));
    attachErrorHandler(this);
  }
}
