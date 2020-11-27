class YarHeader {
  id = 0;
  version = 0;
  magicNum = 0;
  reserved = 0;
  provider = '';
  token = '';
  bodyLen = 0;
}

class YarRequest {
  id: number;
  method = '';
  out: Buffer;

  constructor() {
    this.id = Math.floor(-Math.random() * (1 << 31));
  }

  get mlen() {
    return this.method.length;
  }
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

interface IRPCConnection {
  write(buf: Buffer | string): Promise<boolean>;
  destroy(): void;
}

export { YarHeader, YarResponse, YarPayload, IRPCConnection, YarRequest };
