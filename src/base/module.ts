import * as Koa from 'koa';
import * as compose from 'koa-compose';
import {
  MODULE_METADATA,
  PROCESSOR_METADATA,
  PROCESS_METADATA,
  QUEUE_METADATA,
} from '@/base/consts';
import { ModuleConfig } from '@/common/decorators/module';
import * as Queue from 'bull';

export class BaseModule extends Koa {
  protected queueMap: Record<string, Queue.Queue> = {};
  protected moduleConfig: ModuleConfig;

  constructor() {
    super();
    this.moduleConfig = Reflect.getMetadata(MODULE_METADATA, this.constructor);
    this.handleProviders(this.moduleConfig);
    this.handleControllers(this.moduleConfig);
  }

  protected handleProviders(moduleConfig: ModuleConfig) {
    if (moduleConfig.providers) {
      moduleConfig.providers.forEach((p) => {
        if (p instanceof Queue) {
          this.queueMap[p.name] = p;
        } else {
          this.handleProcessor(p);
        }
      });
    }
  }

  protected handleProcessor(p) {
    const queueName = Reflect.getMetadata(PROCESSOR_METADATA, p.constructor);
    if (queueName && queueName in this.queueMap) {
      const proto = p.constructor.prototype;
      const propKeys = Object.getOwnPropertyNames(p.constructor.prototype);
      propKeys.forEach((k) => {
        const jobName = Reflect.getMetadata(PROCESS_METADATA, proto, k);
        if (jobName) {
          this.queueMap[queueName].process(jobName, proto[k].bind(this));
        }
      });
    }
  }

  protected handleControllers(moduleConfig: ModuleConfig) {
    if (moduleConfig.controllers) {
      moduleConfig.controllers.forEach((c) => {
        const propKeys = Object.getOwnPropertyNames(c);
        propKeys.forEach((p) => {
          const queueName = Reflect.getMetadata(QUEUE_METADATA, c, p);
          if (queueName && queueName in this.queueMap) {
            c[p] = this.queueMap[queueName];
          }
        });
      });
    }
  }

  asMiddleware() {
    const middlewares = [];
    if (this.moduleConfig.imports) {
      middlewares.push(
        ...this.moduleConfig.imports.reduce((acc, m) => {
          acc.push(m.asMiddleware());
          return acc;
        }, []),
      );
    }
    if (this.moduleConfig.controllers) {
      middlewares.push(
        ...this.moduleConfig.controllers.map((c) => c.asMiddleware()),
      );
    }
    return compose(middlewares);
  }

  asApp() {
    this.use(this.asMiddleware());
    return this;
  }
}
