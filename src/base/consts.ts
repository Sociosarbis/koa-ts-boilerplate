const PATH_PREFIX_METADATA = 'path-prefix';
const METHOD_METADATA = 'method';
const PATH_METADATA = 'path';
const MIDDLEWARE_METADATA = 'middleware';
const QUEUE_METADATA = 'queue';
const PROCESSOR_METADATA = 'processor';
const PROCESS_METADATA = 'process';
const MODULE_METADATA = 'module';
const CLASS_FACTORY_METADATA = 'class-factory';

const REQUEST_METHODS = {
  GET: 'get',
  PUT: 'put',
  POST: 'post',
  PATCH: 'patch',
  DEL: 'del',
  ALL: 'all',
} as const;

type RequestMethodEnum = typeof REQUEST_METHODS[keyof typeof REQUEST_METHODS];

export {
  PATH_PREFIX_METADATA,
  METHOD_METADATA,
  PATH_METADATA,
  MIDDLEWARE_METADATA,
  REQUEST_METHODS,
  QUEUE_METADATA,
  MODULE_METADATA,
  PROCESSOR_METADATA,
  PROCESS_METADATA,
  CLASS_FACTORY_METADATA,
  RequestMethodEnum,
};
