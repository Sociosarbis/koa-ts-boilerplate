import { CLASS_FACTORY_METADATA } from '@/base/consts';
interface ICtor<T> {
  new (...args: any[]): T;
}

export default function makeClassFactory<T>(Ctor: ICtor<T>, ...args: any[]) {
  const classFactory = () => {
    return new Ctor(...args);
  };
  Reflect.defineMetadata(CLASS_FACTORY_METADATA, Ctor, classFactory);
  return classFactory;
}
