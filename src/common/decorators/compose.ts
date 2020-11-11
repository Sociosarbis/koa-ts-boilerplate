import { Middleware } from 'koa';
import { MIDDLEWARE_METADATA } from '@/base/consts';

export default function Compose(middlewares: Middleware[]) {
  return function setMiddlewares(target, key) {
    Reflect.defineMetadata(MIDDLEWARE_METADATA, middlewares, target, key);
  };
}
