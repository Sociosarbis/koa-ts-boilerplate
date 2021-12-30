import { INJECT_METADATA } from '@/base/consts';

export function Inject(type: any) {
  return (target, key) => {
    Reflect.defineMetadata(INJECT_METADATA, type, target, key);
  };
}
