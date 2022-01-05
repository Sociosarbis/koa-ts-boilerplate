import { IncomingMessage, ServerResponse } from 'http'
import { Middleware } from 'koa'

type Handler<Request extends IncomingMessage = IncomingMessage, Response extends ServerResponse = ServerResponse> = (req: Request, res: Response, callback: (err?: Error) => void) => void;

export default function expressCompat(handler: Handler): Middleware  {
  return (ctx, next) => {
    return new Promise((res, rej) => {
      handler(ctx.req, ctx.res, async (err) => {
        if (err) rej(err)
        await next()
        res(null)
      })
    })
  }
}