import * as Koa from 'koa'
import * as compose from 'koa-compose'
import {
  MODULE_METADATA,
  PROCESSOR_METADATA,
  PROCESS_METADATA,
  QUEUE_METADATA,
  CLASS_FACTORY_METADATA,
  INJECT_METADATA,
} from '@/base/consts'
import { ModuleConfig } from '@/common/decorators/module'
import * as Queue from 'bull'
import { BaseController } from './controller'

function callHook<T>(obj: T, hookName: 'onModuleInit' | 'onModuleDestroy') {
  if (typeof obj[hookName] === 'function') obj[hookName]()
  return obj
}

export class BaseModule extends Koa {
  parent: BaseModule = null
  imports: BaseModule[] = []
  controllers: BaseController[] = []
  protected queueMap: Record<string, Queue.Queue> = {}
  protected providerMap = new Map<any, any>()
  protected moduleConfig: ModuleConfig

  constructor(parent: BaseModule) {
    super()
    this.parent = parent
    this.moduleConfig = Reflect.getMetadata(MODULE_METADATA, this.constructor)
    this.handleProviders(this.moduleConfig)
    this.handleControllers(this.moduleConfig)
  }

  protected handleProviders(moduleConfig: ModuleConfig) {
    if (moduleConfig.providers) {
      moduleConfig.providers.forEach((p) => {
        const factoryMeta = Reflect.getMetadata(CLASS_FACTORY_METADATA, p)
        const inst = callHook(factoryMeta ? p() : new p(), 'onModuleInit')
        if (factoryMeta === 'queue') {
          this.queueMap[inst.name] = inst
        } else if (Reflect.getMetadata(PROCESSOR_METADATA, p)) {
          this.handleProcessor(p)
        } else {
          this.providerMap.set(p, inst)
        }
      })
    }
  }

  resolveProvider(target: any) {
    let mod: BaseModule = this
    while (mod?.providerMap) {
      if (mod.providerMap.has(target)) return mod.providerMap.get(target)
      mod = mod.parent
    }
  }

  resolveDep(p: any) {
    let prop
    if (p) {
      if (p in this.queueMap) {
        return this.queueMap[p]
      }
      prop = this.resolveProvider(p)
    }
    return prop
  }

  protected handleProcessor(p) {
    const queueName = Reflect.getMetadata(PROCESSOR_METADATA, p)
    if (queueName && queueName in this.queueMap) {
      const proto = p.prototype
      const propKeys = Object.getOwnPropertyNames(p.prototype)
      propKeys.forEach((k) => {
        const jobName = Reflect.getMetadata(PROCESS_METADATA, proto, k)
        if (jobName) {
          this.queueMap[queueName].process(jobName, proto[k].bind(this))
        }
      })
    }
  }

  protected handleControllers(moduleConfig: ModuleConfig) {
    if (moduleConfig.controllers) {
      moduleConfig.controllers.forEach((C) => {
        const paramTypes = [
          ...(Reflect.getMetadata('design:paramtypes', C) || []),
        ]
        paramTypes.forEach((t, i) => {
          paramTypes[i] =
            this.resolveDep(t) ||
            this.resolveDep(Reflect.getMetadata(`design:paramtypes:${i}`, C))
        })
        const c = new C(...paramTypes)
        this.controllers.push(c)
        const propKeys = Object.getOwnPropertyNames(c)
        propKeys.forEach((p) => {
          if (!c[p]) {
            c[p] =
              this.resolveDep(Reflect.getMetadata(QUEUE_METADATA, c, p)) ||
              this.resolveDep(Reflect.getMetadata(INJECT_METADATA, c, p))
          }
        })
      })
    }
  }

  asMiddleware() {
    const middlewares = []
    if (this.moduleConfig.imports) {
      middlewares.push(
        ...this.moduleConfig.imports.reduce((acc, m) => {
          const mod = callHook(new m(this), 'onModuleInit')
          this.imports.push(mod)
          acc.push(mod.asMiddleware())
          return acc
        }, []),
      )
    }
    middlewares.push(...this.controllers.map((c) => c.asMiddleware()))
    return compose(middlewares)
  }

  asApp() {
    this.use(this.asMiddleware())
    return this
  }

  destroy() {
    this.imports.forEach((m) => {
      callHook(m, 'onModuleDestroy')
    })
    Object.values(this.queueMap).forEach((q) => callHook(q, 'onModuleDestroy'))
    this.providerMap.forEach((p) => {
      callHook(p, 'onModuleDestroy')
    })
  }
}
