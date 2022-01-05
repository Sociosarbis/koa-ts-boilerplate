import { BaseModule } from '@/base/module';
import { BaseController } from '@/base/controller';
import { MODULE_METADATA } from '@/base/consts';

export type ModuleConfig = {
  imports?: typeof BaseModule[];
  providers?: any[];
  controllers?: typeof BaseController[];
};

export function Module(config: ModuleConfig) {
  return (target) => {
    Reflect.defineMetadata(MODULE_METADATA, config, target);
  };
}
