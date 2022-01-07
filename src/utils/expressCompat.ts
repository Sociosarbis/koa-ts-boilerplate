import { IncomingMessage, ServerResponse } from 'http'
import { Middleware } from 'koa'

type Handler<
  Request extends IncomingMessage = IncomingMessage,
  Response extends ServerResponse = ServerResponse
> = (req: Request, res: Response, callback: (err?: Error) => void) => void

export default function expressCompat(handler: Handler): Middleware {
  return (ctx, next) => {
    return new Promise((res, rej) => {
      const unlisten = () => {
        ctx.res.off('finish', onResolve)
        ctx.res.off('close', onReject)
        ctx.res.off('error', onReject)
      }
      const listen = () => {
        ctx.res.on('finish', onResolve)
        ctx.res.on('close', onReject)
        ctx.res.on('error', onReject)
      }
      const onReject = (e) => {
        unlisten()
        rej(e)
      }
      const onResolve = () => {
        unlisten()
        res(null)
      }
      listen()
      handler(ctx.req, ctx.res, async (err) => {
        unlisten()
        if (err) ctx.onerror(err)
        try {
          await next()
        } catch (e) {
          ctx.onerror(e)
        }
        res(null)
      })
    })
  }
}
