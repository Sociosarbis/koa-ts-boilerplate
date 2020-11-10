import * as Router from 'koa-router';
import { PATH_PREFIX_METADATA, METHOD_METADATA, PATH_METADATA } from './consts';

export class BaseController {
  protected readonly router = new Router();
  private _prefix: string;

  initialize() {
    const prefix = Reflect.getMetadata(PATH_PREFIX_METADATA, this.constructor);
    this._prefix = this._cleanSegment(prefix);
    this.router.prefix(this._prefix);
    this._registerRoutes();
    return this;
  }

  protected _cleanSegment(segment: string) {
    if (!segment.startsWith('/')) segment = `/${segment}`;
    if (segment.endsWith('/')) return segment.replace(/\/+$/g, '');
    return segment;
  }

  protected _registerRoutes() {
    const proto = this.constructor.prototype;
    const handlers = Object.getOwnPropertyNames(proto);
    handlers.forEach((fnName) => {
      const method: string = Reflect.getMetadata(
        METHOD_METADATA,
        proto,
        fnName,
      );
      if (method) {
        const path = Reflect.getMetadata(PATH_METADATA, proto, fnName);
        this.router[method](this._cleanSegment(path), proto[fnName]);
      }
    });
  }

  asMiddleware() {
    return this.router.routes();
  }
}
