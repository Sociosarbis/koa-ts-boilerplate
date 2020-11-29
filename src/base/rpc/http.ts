import * as http from 'http';
import { EventEmitter } from 'events';
import { IRPCConnection, YarHeader, YarResponse } from './structs';
import { NODE_YAR_USER_AGENT } from './const';
import { createDataHandler } from './helpers';

type HTTPConnectionConfig = http.RequestOptions & { persistent?: boolean };

const defaultHeaders = {
  'User-Agent': NODE_YAR_USER_AGENT,
  Expect: '',
};

export class HTTPConnection extends EventEmitter implements IRPCConnection {
  conn: http.ClientRequest;
  constructor(config: HTTPConnectionConfig) {
    super();
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
    );
    this.conn = http.request(config);
    this.conn.on('response', this.handleResponse);
    this.conn.on('close', this.handleClose);
    this.conn.on('error', this.handleError);
  }

  async write(buf: Buffer | string) {
    return this.conn.write(buf);
  }

  handleResponse = (response: http.IncomingMessage) => {
    response.on('data', createDataHandler(this.handleDataUnpacked));
  };

  handleDataUnpacked = (header: YarHeader, response: YarResponse) => {
    this.emit('response', {
      header,
      response,
    });
  };

  handleError = (err: Error) => {
    console.error('服务器异常：', err);
    this.emit('error', err);
  };

  handleClose = () => {
    console.log('客户端链接断开');
    this.emit('close');
  };

  destroy() {
    this.conn.destroy();
  }
}
