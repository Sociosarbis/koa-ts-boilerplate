import * as mp from '@msgpack/msgpack';

interface IYarPackager {
  name: string;
  pack: (obj: any) => ArrayBufferLike;
  unpack: (buf: Buffer) => any;
}

class MSGPACKPackager implements IYarPackager {
  name = 'MSGPACK';
  pack(obj: any) {
    return mp.encode(obj).buffer;
  }
  unpack(buf: Buffer) {
    return mp.decode(buf);
  }
}

class JSONPackager implements IYarPackager {
  name = 'JSON';
  pack(obj: any) {
    return Buffer.from(JSON.stringify(obj)).buffer;
  }
  unpack(buf: Buffer) {
    return JSON.parse(buf.toString());
  }
}

export { MSGPACKPackager, JSONPackager, IYarPackager };
