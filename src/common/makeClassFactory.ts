import { CLASS_FACTORY_METADATA } from '@/base/consts';

interface Constructor {
  new (...args: any[]): any;
}

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
