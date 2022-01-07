import { Context } from 'koa'
import { RouterContext } from 'koa-router'

type AppContext = Context & RouterContext

type AnyFunc<T = any> = (...args: any[]) => T

export { AppContext, AnyFunc }
