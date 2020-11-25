import * as net from 'net';
import * as mp from '@msgpack/msgpack';
import { ByteArray } from '@/utils/byteArray';
import { timeStamp } from 'console';

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
  out: Buffer;
};

type YarHeader = {
  id: number;
  version: number;
  magic_num: number;
  reserved: number;
  provider: string;
  token: string;
  bodyLen: number;
};

type YarResponse = {
  id: number;
  status: number;
  error: string;
  elen: number;
  in: Buffer;
  payload: YarPayload;
  out: Buffer;
  buffer: Buffer;
};

type YarPayload = {
  data: Buffer;
  size: number;
};

const YAR_PROTOCOL_MAGIC_NUM = 0x80dfec60;

class YarClient {
  conn: net.Socket;
  host: string;
  port: number;
  persistent = false;
  connected = false;
  _readBuffer: Buffer;
  _readOffset = 0;
  _readHeader: Partial<YarHeader>;
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
    this.conn.on('data', this.handleResponse);
  }

  async call(method: string, args: any[] = []) {
    await this._connectPromise;
    const request = this.createRequest(method);
    const header: Partial<YarHeader> = {};
    header.magic_num = YAR_PROTOCOL_MAGIC_NUM;
    header.provider = 'Yar(Node)-0.0.1';
    header.id = request.id;
    header.reserved = this.persistent ? 1 : 0;
    request.out = Buffer.from(mp.encode(args).buffer, 0);
    const payload = this.packRequest(request as YarRequest, 100);
    this.packHeader(header).copy(payload.data, 0, 0);
    payload.data.write('MSGPACK', 82, 8);
    this._readOffset = 0;
    this.conn.write(payload.data);
  }

  packRequest(req: YarRequest, extraBytes: number) {
    const requestKeys = {
      i: req.id,
      m: req.mlen,
      p: req.out,
    };
    const pk = Buffer.from(mp.encode(requestKeys).buffer, 0);
    const tmp: Partial<YarPayload> = {};
    tmp.data = Buffer.alloc(extraBytes + pk.length);
    tmp.size = tmp.data.length;
    pk.copy(tmp.data, extraBytes, 0, pk.length);
    return tmp;
  }

  packHeader(header: Partial<YarHeader>) {
    const headerPack = new ByteArray(82);
    headerPack.writeUInt(header.id);
    headerPack.skip(2);
    headerPack.writeUInt(header.magic_num);
    headerPack.writeUInt(header.reserved);
    headerPack.writeStr(header.provider, 32);
    headerPack.skip(32);
    headerPack.writeUInt(header.bodyLen);
    return headerPack.buffer;
  }

  unpackHeader(buf: Buffer) {
    const headerPack = ByteArray.from(buf, 82);
    const header: Partial<YarHeader> = {};
    header.id = headerPack.readUInt();
    headerPack.skip(2);
    header.magic_num = headerPack.readUInt();
    if (header.magic_num !== YAR_PROTOCOL_MAGIC_NUM) return false;
    header.reserved = headerPack.readUInt();
    header.provider = headerPack.readStr(32);
    headerPack.skip(32);
    header.bodyLen = headerPack.readUInt();
    return header;
  }

  createRequest(method: string) {
    const request: Partial<YarRequest> = {};
    request.id = 1000;
    request.method = method;
    request.mlen = method.length;
    return request;
  }

  handleResponse = (data: Buffer) => {
    if (this._readOffset === -1) return;
    if (!this._readBuffer) {
      this._readBuffer = data;
    } else {
      this._readBuffer = Buffer.concat([this._readBuffer, data]);
    }
    if (this._readOffset === 0 && this._readBuffer.length >= 82) {
      this._readOffset = 82;
      const header = this.unpackHeader(this._readBuffer);
      if (header) {
        this._readHeader = header;
      }
    } else if (this._readBuffer.length >= 82 + this._readHeader.bodyLen) {
      const body = ByteArray.from(
        this._readBuffer,
        this._readHeader.bodyLen,
        82,
      );
      const obj = mp.decode(body.buffer.subarray(8)) as Record<string, any>;
      const response: Partial<YarResponse> = {};
      response.id = obj.i;
      response.status = obj.s;
      response.error = obj.e;
      response.elen = obj.e.length;
      response.in = obj.r;
      response.payload = {
        data: body.buffer,
        size: body.buffer.length,
      };
      this._readOffset = -1;
      this._readBuffer = null;
    }
  };

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

// createClient(8040, '172.17.20.118');
export { createServer, createClient };
