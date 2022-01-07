import * as mp from '@msgpack/msgpack'

interface IYarPackager {
  name: string
  pack: (obj: any) => Buffer
  unpack: (buf: Buffer) => any
}

class MSGPACKPackager implements IYarPackager {
  name = 'MSGPACK'
  pack(obj: any) {
    const data = mp.encode(obj)
    return Buffer.from(data.buffer, 0, data.length)
  }
  unpack(buf: Buffer) {
    return mp.decode(buf)
  }
}

class JSONPackager implements IYarPackager {
  name = 'JSON'
  pack(obj: any) {
    return Buffer.from(JSON.stringify(obj))
  }
  unpack(buf: Buffer) {
    return JSON.parse(buf.toString())
  }
}

export { MSGPACKPackager, JSONPackager, IYarPackager }
