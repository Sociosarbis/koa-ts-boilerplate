import * as net from 'net';
import { packHeader } from './rpc/helpers';
import {
  YAR_PROTOCOL_MAGIC_NUM,
  YAR_HEADER_LEN,
  YAR_PROVIDER,
  YAR_PACKAGER_LEN,
  packagers,
} from './rpc/const';
import { IYarPackager } from './rpc/packagers';
import { YarPayload, YarRequest, IRPCConnection } from './rpc/structs';
import { HTTPConnection } from './rpc/http';
import { TCPConnection } from './rpc/tcp';
import { encrypt } from './rpc/mcrypt';
import * as url from 'url';

function createServer(port: number, host = '127.0.0.1') {
  // 创建一个 TCP 服务实例
  const server = net.createServer();
  // 监听端口
  server.listen(port, host);
  server.on('listening', () => {
    console.log(`服务已开启在 ${host}:${port}`);
  });
  server.on('connection', (socket) => {
    // data 事件就是读取数据
    socket.on('data', (buffer) => {
      const msg = buffer.toString();
      console.log(msg);
      // write 方法写入数据，发回给客户端
      const header = `HTTP/1.1 200 OK\r\nContent-Type: text/plain; charset=utf-8\r\n\r\n\r\n`;
      socket.write(Buffer.from(header + '你好 ' + msg));
      socket.end();
    });
  });
  server.on('close', () => {
    console.log('Server Close!');
  });
  server.on('error', (err) => {
    if (err.message === 'EADDRINUSE') {
      console.log('地址正被使用，重试中...');
      setTimeout(() => {
        server.close();
        server.listen(port, host);
      }, 1000);
    } else {
      console.error('服务器异常：', err);
    }
  });
  return server;
}

class YarHeader {
  id = 0;
  version = 0;
  magicNum = 0;
  reserved = 0;
  provider = '';
  token = '';
  bodyLen = 0;
}

class YarClient {
  conn: IRPCConnection;
  protocol: string;
  host: string;
  port: number;
  uri: string;
  persistent = false;
  packager: IYarPackager;

  static protocolConnections = {
    'tcp:': TCPConnection,
    'http:': HTTPConnection,
  } as const;

  constructor(uri: string, options: { packager?: 'JSON' | 'MSGPACK' } = {}) {
    const urlObj = url.parse(uri);
    this.port = urlObj.port ? Number(urlObj.port) : 80;
    this.host = urlObj.host;
    this.packager = new packagers[options.packager || 'JSON']();
    this.protocol = urlObj.protocol;
    this.uri = urlObj.path || '/';
    this.init();
  }

  init() {
    this.conn = new YarClient.protocolConnections[this.protocol]({
      host: this.host,
      port: this.port,
      path: this.uri,
      persistent: this.persistent,
    });
  }

  async call(method, args: any[] = []) {
    const request = this.createRequest(method);
    const header = new YarHeader();
    header.magicNum = YAR_PROTOCOL_MAGIC_NUM;
    header.provider = YAR_PROVIDER;
    header.id = request.id;
    header.reserved = this.persistent ? 1 : 0;
    request.out = args;
    const payload = this.packRequest(
      request,
      YAR_HEADER_LEN + YAR_PACKAGER_LEN,
    );
    packHeader(header).copy(payload.data, 0, 0);
    payload.data.write(this.packager.name, YAR_HEADER_LEN, YAR_PACKAGER_LEN);
    await this.conn.write(payload.data);
  }

  packRequest(req: YarRequest, extraBytes: number) {
    const requestKeys = {
      i: req.id,
      m: req.method,
      p: req.out,
    };
    const pk = this.packager.pack(requestKeys);
    const tmp = new YarPayload();
    tmp.data = Buffer.alloc(extraBytes + pk.length);
    pk.copy(tmp.data, extraBytes, 0, pk.length);
    return tmp;
  }

  createRequest(method: string) {
    const request = new YarRequest();
    request.method = method;
    return request;
  }

  destroy() {
    this.conn.destroy();
  }
}

/*const client = new YarClient('http://172.17.20.30/exam/rpc/common', {
  packager: 'JSON',
});

client.call('common', [
  'getGoodPaperLabel',
  'ad8a7fda5270718621a69b86676f5856',
  encrypt(Buffer.from(JSON.stringify({ uid: 201816870 })), 'sdkfskfk'),
]);*/

export { createServer, YarClient };
