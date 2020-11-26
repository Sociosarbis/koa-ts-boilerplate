import * as http from 'http';
import { NODE_YAR_USER_AGENT } from './const';

type HTTPConnectionConfig = http.RequestOptions & { persistent?: boolean };

const defaultHeaders = {
  'User-Agent': NODE_YAR_USER_AGENT,
  Expect: '',
};

class HTTPConnection {
  conn: http.ClientRequest;
  constructor(config: HTTPConnectionConfig) {
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
    this.conn.end();
  }

  handleResponse = (response: http.IncomingMessage) => {
    response.pipe(process.stdout);
  };

  handleError = (err: Error) => {
    console.error('服务器异常：', err);
  };

  handleClose = () => {
    console.log('客户端链接断开');
  };
}

new HTTPConnection({
  host: 'www.baidu.com',
});
