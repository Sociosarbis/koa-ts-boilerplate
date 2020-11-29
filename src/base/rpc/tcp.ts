import * as net from 'net';
import { EventEmitter } from 'events';
import { createDataHandler } from './helpers';
import { YarHeader, IRPCConnection, YarResponse } from './structs';

type TCPConnectionConfig = net.TcpSocketConnectOpts & { persistent?: boolean };

export class TCPConnection extends EventEmitter implements IRPCConnection {
  conn: net.Socket;
  connected = false;
  requesting = false;
  private _connectPromise: Promise<void>;
  private _connectRes: () => void;
  constructor(config: TCPConnectionConfig) {
    super();
    this.conn = net.createConnection({
      host: config.host,
      port: config.port,
    });
    this.conn.on('connect', this.handleConnect);
    this.conn.on('data', createDataHandler(this.handleDataUnpacked));
    this.conn.on('close', this.handleClose);
    this.conn.on('error', this.handleError);
  }

  connect() {
    if (this.connected) {
      this.destroy();
    }
    this._createPendingPromise();
  }

  _createPendingPromise() {
    this._connectPromise = new Promise((res) => {
      this._connectRes = res;
    }).then(() => {
      this.connected = true;
    });
  }

  async write(buf: Buffer | string) {
    if (this.requesting) return false;
    await this._connectPromise;
    this.requesting = true;
    return this.conn.write(buf);
  }

  handleDataUnpacked = (header: YarHeader, response: YarResponse) => {
    this.requesting = false;
    this.emit('response', {
      header,
      response,
    });
  };

  handleConnect = () => {
    this._connectRes();
  };

  handleError = (err: Error) => {
    this.requesting = false;
    console.error('服务器异常：', err);
    this.emit('error', err);
  };

  handleClose = () => {
    this.requesting = false;
    console.log('客户端链接断开');
    this.connected = false;
    this.emit('close');
  };

  destroy() {
    this.requesting = false;
    this.conn.destroy();
  }
}
