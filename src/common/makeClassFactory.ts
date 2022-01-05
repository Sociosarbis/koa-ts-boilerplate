import { CLASS_FACTORY_METADATA } from '@/base/consts';


function markClassFactory<T extends (...args: unknown[]) => unknown>(
  factory: T,
  type?: unknown,
) {
  Reflect.defineMetadata(CLASS_FACTORY_METADATA, type || true, factory);
  return factory;
}

export { markClassFactory };
