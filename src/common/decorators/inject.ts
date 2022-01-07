import { INJECT_METADATA } from '@/base/consts'

export function Inject(type: any) {
  return (target: unknown, key: string, index?: number) => {
    if (isNaN(index)) {
      Reflect.defineMetadata(INJECT_METADATA, type, target, key)
    } else {
      Reflect.defineMetadata(`design:paramtypes:${index}`, type, target)
    }
  }
}
