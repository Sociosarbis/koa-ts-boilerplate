import { INJECTABLE_METADATA } from '@/base/consts'

export function Injectable(key?: any) {
  return (target: unknown) => {
    Reflect.defineMetadata(INJECTABLE_METADATA, key, target)
  }
}
