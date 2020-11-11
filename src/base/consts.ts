const PATH_PREFIX_METADATA = 'path-prefix';
const METHOD_METADATA = 'method';
const PATH_METADATA = 'path';
const MIDDLEWARE_METADATA = 'middleware';

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
  RequestMethodEnum,
};
