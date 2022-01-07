import {
  RequestMethodEnum,
  METHOD_METADATA,
  PATH_METADATA,
} from '@/base/consts'

function createMethodDecorator(method: RequestMethodEnum) {
  return function addRoute(path = '') {
    return function addHandler(target, key) {
      Reflect.defineMetadata(METHOD_METADATA, method, target, key)
      Reflect.defineMetadata(PATH_METADATA, path, target, key)
    }
  }
}

const Get = createMethodDecorator('get')
const Post = createMethodDecorator('post')
const Patch = createMethodDecorator('patch')
const Del = createMethodDecorator('del')
const All = createMethodDecorator('all')
const Put = createMethodDecorator('put')

export { Get, Post, Patch, Del, All, Put }
