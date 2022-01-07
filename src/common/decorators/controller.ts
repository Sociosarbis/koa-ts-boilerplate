import { PATH_PREFIX_METADATA } from '@/base/consts'
import { BaseController } from '@/base/controller'

export function Controller(prefix = '') {
  return function decorateController<T extends typeof BaseController>(
    target: T,
  ) {
    Reflect.defineMetadata(PATH_PREFIX_METADATA, prefix, target)
  }
}
