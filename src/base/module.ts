import * as Koa from 'koa';
import * as compose from 'koa-compose';
import {
  MODULE_METADATA,
  PROCESSOR_METADATA,
  PROCESS_METADATA,
  QUEUE_METADATA,
  CLASS_FACTORY_METADATA,
  INJECT_METADATA,
} from '@/base/consts';
import { ModuleConfig } from '@/common/decorators/module';
import * as Queue from 'bull';

export class BaseModule extends Koa {
  protected queueMap: Record<string, Queue.Queue> = {};
  protected providerMap = new Map<any, any>();
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
        const inst = Reflect.getMetadata(CLASS_FACTORY_METADATA, p)
          ? p()
          : new p();
        if (inst instanceof Queue) {
          this.queueMap[inst.name] = inst;
        } else if (Reflect.getMetadata(PROCESSOR_METADATA, p)) {
          this.handleProcessor(p);
        } else {
          this.providerMap.set(p, inst);
        }
      });
    }
  }

  protected handleProcessor(p) {
    const queueName = Reflect.getMetadata(PROCESSOR_METADATA, p);
    if (queueName && queueName in this.queueMap) {
      const proto = p.prototype;
      const propKeys = Object.getOwnPropertyNames(p.prototype);
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
          const signature = Reflect.getMetadata(INJECT_METADATA, c, p);
          if (signature && this.providerMap.has(signature)) {
            c[p] = this.providerMap.get(signature);
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
          acc.push(new m().asMiddleware());
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
