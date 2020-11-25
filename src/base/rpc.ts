import * as net from 'net';
import * as mp from '@msgpack/msgpack';
import { ByteArray } from '@/utils/byteArray';

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

class YarRequest {
  id = 1000;
  method = '';
  out: Buffer;

  get mlen() {
    return this.method.length;
  }
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

class YarResponse {
  id = 0;
  status = 0;
  error = '';
  in: Buffer;
  payload: YarPayload;
  out: Buffer;
  buffer: Buffer;

  get elen() {
    return this.error.length;
  }
}

class YarPayload {
  data: Buffer;

  get size() {
    return this.data ? this.data.length : 0;
  }
}

const YAR_PROTOCOL_MAGIC_NUM = 0x80dfec60;

const YAR_PROVIDER = 'Yar(Node)-0.0.1';

const YAR_PACKAGER = 'MSGPACK';

const YAR_PACKAGER_LEN = 8;

const YAR_HEADER_LEN = 82;

class YarClient {
  conn: net.Socket;
  host: string;
  port: number;
  persistent = false;
  connected = false;
  _readBuffer: Buffer;
  _readOffset = 0;
  _readHeader: YarHeader;
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
    const header = new YarHeader();
    header.magicNum = YAR_PROTOCOL_MAGIC_NUM;
    header.provider = YAR_PROVIDER;
    header.id = request.id;
    header.reserved = this.persistent ? 1 : 0;
    request.out = Buffer.from(mp.encode(args).buffer, 0);
    const payload = this.packRequest(request, 100);
    this.packHeader(header).copy(payload.data, 0, 0);
    payload.data.write(YAR_PACKAGER, YAR_HEADER_LEN, YAR_PACKAGER_LEN);
    this._readOffset = 0;
    this.conn.write(payload.data);
  }

  packRequest(req: YarRequest, extraBytes: number) {
    const requestKeys = {
      i: req.id,
      m: req.method,
      p: req.out,
    };
    const pk = Buffer.from(mp.encode(requestKeys).buffer, 0);
    const tmp = new YarPayload();
    tmp.data = Buffer.alloc(extraBytes + pk.length);
    pk.copy(tmp.data, extraBytes, 0, pk.length);
    return tmp;
  }

  packHeader(header: YarHeader) {
    const headerPack = new ByteArray(YAR_HEADER_LEN);
    headerPack.writeUInt(header.id);
    headerPack.skip(2);
    headerPack.writeUInt(header.magicNum);
    headerPack.writeUInt(header.reserved);
    headerPack.writeStr(header.provider, 32);
    headerPack.skip(32);
    headerPack.writeUInt(header.bodyLen);
    return headerPack.buffer;
  }

  unpackHeader(buf: Buffer) {
    const headerPack = ByteArray.from(buf, YAR_HEADER_LEN);
    const header = new YarHeader();
    header.id = headerPack.readUInt();
    headerPack.skip(2);
    header.magicNum = headerPack.readUInt();
    if (header.magicNum !== YAR_PROTOCOL_MAGIC_NUM) return false;
    header.reserved = headerPack.readUInt();
    header.provider = headerPack.readStr(32);
    headerPack.skip(32);
    header.bodyLen = headerPack.readUInt();
    return header;
  }

  createRequest(method: string) {
    const request = new YarRequest();
    request.method = method;
    return request;
  }

  handleResponse = (data: Buffer) => {
    if (this._readOffset === -1) return;
    if (!this._readBuffer) {
      this._readBuffer = data;
    } else {
      this._readBuffer = Buffer.concat([this._readBuffer, data]);
    }
    if (this._readOffset === 0 && this._readBuffer.length >= YAR_HEADER_LEN) {
      this._readOffset = YAR_HEADER_LEN;
      const header = this.unpackHeader(this._readBuffer);
      if (header) {
        this._readHeader = header;
      }
    } else if (
      this._readBuffer.length >=
      YAR_HEADER_LEN + this._readHeader.bodyLen
    ) {
      const body = ByteArray.from(
        this._readBuffer,
        YAR_HEADER_LEN + this._readHeader.bodyLen,
        0,
      );
      const obj = mp.decode(
        body.buffer.subarray(YAR_HEADER_LEN + YAR_PACKAGER_LEN),
      ) as Record<string, any>;
      const response = new YarResponse();
      response.id = obj.i;
      response.status = obj.s;
      response.error = obj.e;
      response.in = obj.r.buffer;
      response.payload = new YarPayload();
      response.payload.data = body.buffer;
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
