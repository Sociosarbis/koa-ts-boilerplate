import { CLASS_FACTORY_METADATA } from '@/base/consts';

interface Constructor {
  new (...args: any[]): any;
}

function markClassFactory<T extends () => unknown>(factory: T) {
  Reflect.defineMetadata(CLASS_FACTORY_METADATA, true, factory);
  return factory;
}

export { markClassFactory };

export default function makeClassFactory<T extends Constructor>(
  Ctor: T,
  ...args: ConstructorParameters<T>
) {
  const classFactory = () => {
    return new Ctor(...args);
  };
  Reflect.defineMetadata(CLASS_FACTORY_METADATA, Ctor, classFactory);
  return classFactory;
}
