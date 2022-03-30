import * as Koa from 'koa'
import * as compose from 'koa-compose'
import {
  MODULE_METADATA,
  PROCESSOR_METADATA,
  PROCESS_METADATA,
  QUEUE_METADATA,
  CLASS_FACTORY_METADATA,
  INJECT_METADATA,
  INJECTABLE_METADATA,
} from '@/base/consts'
import { ModuleConfig } from '@/common/decorators/module'
import * as Queue from 'bull'
import { BaseController } from './controller'
import { isTest } from '@/utils/env'

function callHook<T>(obj: T, hookName: 'onModuleInit' | 'onModuleDestroy') {
  if (typeof obj[hookName] === 'function') obj[hookName]()
  return obj
}

export function addMockObject(map: Map<any, any>, p: any) {
  const providerKey = Reflect.getMetadata(INJECTABLE_METADATA, p)
  map.set(providerKey, p)
}

export type ModuleOptions = { mockProviderMap?: Map<any, any> }

export class BaseModule extends Koa {
  parent: BaseModule = null
  imports: BaseModule[] = []
  controllers: BaseController[] = []
  #isReady: Promise<void>
  #mockProviderMap?: Map<any, any>
  protected queueMap: Record<string, Queue.Queue> = {}
  protected providerMap = new Map<any, any>()
  protected moduleConfig: ModuleConfig

  constructor(parent: BaseModule, options: ModuleOptions = {}) {
    super()
    this.parent = parent
    this.#mockProviderMap = options.mockProviderMap
    this.moduleConfig = Reflect.getMetadata(MODULE_METADATA, this.constructor)
    this.#isReady = this.handleProviders(this.moduleConfig).then(() =>
      this.handleControllers(this.moduleConfig),
    )
  }

  isReady() {
    return this.#isReady
  }

  protected async handleProviders(moduleConfig: ModuleConfig) {
    if (moduleConfig.providers) {
      await Promise.all(
        moduleConfig.providers.map(async (p) => {
          const factoryMeta = Reflect.getMetadata(CLASS_FACTORY_METADATA, p)
          const providerKey = Reflect.getMetadata(INJECTABLE_METADATA, p)
          if (isTest && this.#mockProviderMap?.has(providerKey)) {
            p = this.#mockProviderMap.get(providerKey)
          }
          const params = this.resolveParams(p)
          let inst = factoryMeta ? p(...params) : new p(...params)
          if (inst instanceof Promise) {
            inst = await inst
          }
          inst = callHook(inst, 'onModuleInit')
          if (factoryMeta === 'queue') {
            this.queueMap[inst.name] = inst
          } else if (Reflect.getMetadata(PROCESSOR_METADATA, p)) {
            this.handleProcessor(p)
          } else {
            this.providerMap.set(providerKey ?? p, inst)
          }
        }),
      )
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

  private resolveParams<T extends Constructor | AnyFunc>(C: T) {
    return (Reflect.getMetadata('design:paramtypes', C) || []).map(
      (t, i) =>
        this.resolveDep(Reflect.getMetadata(`design:paramtypes:${i}`, C)) ||
        this.resolveDep(t),
    )
  }

  protected handleControllers(moduleConfig: ModuleConfig) {
    if (moduleConfig.controllers) {
      moduleConfig.controllers.forEach((C) => {
        const c = new C(...this.resolveParams(C))
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

  async asMiddleware() {
    const middlewares = []
    if (this.moduleConfig.imports) {
      await this.#isReady
      await Promise.all(
        this.moduleConfig.imports.map(async (m) => {
          const mod = callHook(
            new m(this, { mockProviderMap: this.#mockProviderMap }),
            'onModuleInit',
          )
          this.imports.push(mod)
          await mod.isReady()
          middlewares.push(await mod.asMiddleware())
        }),
      )
    }
    middlewares.push(...this.controllers.map((c) => c.asMiddleware()))
    return compose(middlewares)
  }

  async asApp() {
    this.use(await this.asMiddleware())
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
