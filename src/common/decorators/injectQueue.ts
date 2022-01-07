import { QUEUE_METADATA } from '@/base/consts'

export function InjectQueue(name: string) {
  return (target, key) => {
    Reflect.defineMetadata(QUEUE_METADATA, name, target, key)
  }
}
