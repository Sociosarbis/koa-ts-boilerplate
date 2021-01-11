import * as net from 'net';
import { BaseConnection } from './connections/base';
import { createDataHandler } from './helpers';
import { IRPCConnection } from './structs';

type TCPConnectionConfig = net.TcpSocketConnectOpts & { persistent?: boolean };

export class TCPConnection extends BaseConnection implements IRPCConnection {
  conn: net.Socket;
  config: TCPConnectionConfig;
  connected = false;
  requesting = false;
  private _connectPromise: Promise<void>;
  private _connectRes: () => void;
  constructor(config: TCPConnectionConfig) {
    super();
    this.config = config;
    this.conn = net.createConnection({
      host: this.config.host,
      port: this.config.port,
    });
    this.waitForResponse();
    this.conn.on('connect', this.handleConnect);
    this.conn.on('data', createDataHandler(this._responseResolver));
    this.conn.on('close', this.handleClose);
    this.conn.on('error', this.handleError);
    this._createPendingPromise();
  }

  async connect(cb: (conn: net.Socket) => Promise<any>) {
    await this._connectPromise;
    await cb(this.conn);
    return this;
  }

  _createPendingPromise() {
    this._connectPromise = new Promise((res) => {
      this._connectRes = res as () => void;
    }).then(() => {
      this.connected = true;
    });
  }

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
