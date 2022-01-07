import { createProxyServer } from 'http-proxy'

type Server = ReturnType<typeof createProxyServer>

export class ProxyService {
  server = createProxyServer({
    ignorePath: true,
    changeOrigin: true,
  })

  proxyWeb = (
    req: Parameters<Server['web']>[0],
    res: Parameters<Server['web']>[1],
    options: Parameters<Server['web']>[2],
  ) => {
    return new Promise((resolve, reject) => {
      const unlisten = () => {
        res.off('finish', onResolve)
        res.off('close', onReject)
        res.off('error', onReject)
      }
      const listen = () => {
        res.on('finish', onResolve)
        res.on('close', onReject)
        res.on('error', onReject)
      }
      const onReject = (e) => {
        unlisten()
        reject(e)
      }
      const onResolve = () => {
        unlisten()
        resolve(null)
      }
      listen()
      this.server.web(req, res, options, (e) => onReject(e))
    })
  }
}
