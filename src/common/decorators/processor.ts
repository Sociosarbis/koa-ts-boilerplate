import { PROCESSOR_METADATA, PROCESS_METADATA } from '@/base/consts';

function Processor(name: string) {
  return (target) => {
    Reflect.defineMetadata(PROCESSOR_METADATA, name, target);
  };
}

function Process(jobName: string) {
  return (target, key) => {
    Reflect.defineMetadata(PROCESS_METADATA, jobName, target, key);
  };
}

export { Processor, Process };
