import * as http from 'http'
import { BaseConnection } from './connections/base'
import { IRPCConnection } from './structs'
import { NODE_YAR_USER_AGENT } from './const'
import { createDataHandler } from './helpers'

type HTTPConnectionConfig = http.RequestOptions & {
  persistent?: boolean
  connTimeout?: number
}

const defaultHeaders = {
  'User-Agent': NODE_YAR_USER_AGENT,
  Expect: '',
}

export class HTTPConnection extends BaseConnection implements IRPCConnection {
  conn: http.ClientRequest
  config: HTTPConnectionConfig
  constructor(config: HTTPConnectionConfig) {
    super()
    config.headers = Object.assign(
      { Hostname: config.host },
      defaultHeaders,
      config.headers,
      config.persistent
        ? {
            Connection: 'Keep-Alive',
            'Keep-Alive': 300,
          }
        : {
            Connection: 'close',
          },
    )
    config.method = 'POST'
    this.config = config
  }

  async connect(
    cb: (conn: http.ClientRequest) => Promise<any> = () => Promise.resolve(),
  ) {
    const config = Object.assign({}, this.config)
    config.timeout = this.config.connTimeout
    this.conn = http.request(config)
    this.conn.setTimeout(this.config.timeout)
    this.waitForResponse()
    this.conn.on('response', this.handleResponse)
    this.conn.on('close', this.handleClose)
    this.conn.on('error', this.handleError)
    await cb(this.conn)
    this.conn.end()
    return this
  }

  handleResponse = (response: http.IncomingMessage) => {
    response.on('data', createDataHandler(this._responseResolver))
  }

  handleError = (err: Error) => {
    console.error('服务器异常：', err)
    this.emit('error', err)
  }

  handleClose = () => {
    console.log('客户端链接断开')
    this.emit('close')
  }

  destroy() {
    this.conn.destroy()
  }
}
