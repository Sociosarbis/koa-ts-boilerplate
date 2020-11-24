import * as net from 'net';
import mp from '@msgpack/msgpack';

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

function createClient(port: number, host = '127.0.0.1') {
  const client = net.createConnection({
    host,
    port,
  });

  client.on('connect', () => {
    // 向服务器发送数据
  });
  client.on('data', (buffer) => {
    console.log(buffer.toString());
  });
  // 例如监听一个未开启的端口就会报 ECONNREFUSED 错误
  client.on('error', (err) => {
    console.error('服务器异常：', err);
  });
  client.on('close', (err) => {
    console.log('客户端链接断开！', err);
  });
  return client;
}

type YarRequest = {
  id: number;
  method: string;
  mlen: number;
};

class YarClient {
  conn: net.Socket;
  host: string;
  port: number;
  connected = false;
  private _connectPromise: Promise<void>;
  private _connectRes: () => void;

  constructor(port: number, host = '127.0.0.1') {
    this.port = port;
    this.host = host;
    this.init();
  }

  init() {
    this.connect();
    this.conn.on('connect', this.handleConnect);
    this.conn.on('close', this.handleDisconnect);
  }

  async call(method: string, args: any[] = []) {
    await this._connectPromise;
    const request = this.createRequest(method);
    const params = mp.encode(args);
  }

  createRequest(method: string) {
    const request: Partial<YarRequest> = {};
    request.id = 1000;
    request.method = method;
    request.mlen = method.length;
    return request;
  }

  connect() {
    if (this.connected) {
      this.destroy();
    }
    this._createPendingPromise();
    this.conn = createClient(this.port, this.host);
  }

  _createPendingPromise() {
    this._connectPromise = new Promise((res) => {
      this._connectRes = res;
    }).then(() => {
      this.connected = true;
    });
  }

  handleConnect = () => {
    this._connectRes();
  };

  handleDisconnect = () => {
    this.connected = false;
  };

  destroy() {
    this.conn.destroy();
  }
}

createClient(8040, '172.17.20.118');

export { createServer, createClient };
