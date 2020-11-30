import { ByteArray } from '@/utils/byteArray';
import {
  YAR_PROTOCOL_MAGIC_NUM,
  YAR_HEADER_LEN,
  YAR_PACKAGER_LEN,
  packagers,
} from './const';
import { IYarPackager } from './packagers';
import { YarHeader, YarPayload, YarResponse } from './structs';

function unpackHeader(buf: Buffer) {
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

function packHeader(header: YarHeader) {
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

function unpackResponse(buf: Buffer) {
  const packagerName = buf
    .subarray(YAR_HEADER_LEN, YAR_HEADER_LEN + YAR_PACKAGER_LEN)
    .toString()
    /** 以 \0为 name的终止标志 */
    .replace(/\u0000+.*$/, '');
  const packager: IYarPackager = new packagers[packagerName]();
  const obj = packager.unpack(
    buf.subarray(YAR_HEADER_LEN + YAR_PACKAGER_LEN),
  ) as Record<string, any>;
  const response = new YarResponse();
  response.id = obj.i;
  response.status = obj.s;
  response.error = obj.e;
  response.in = obj.r;
  response.payload = new YarPayload();
  response.payload.data = buf;
  return response;
}

function createDataHandler(
  cb: (header?: YarHeader, response?: YarResponse) => any,
) {
  let offset = 0;
  let header: YarHeader = null;
  let buffer: Buffer = null;
  return function handleData(data: Buffer) {
    if (!buffer) {
      buffer = data;
    } else {
      buffer = Buffer.concat([buffer, data]);
    }

    if (offset === 0 && buffer.length >= YAR_HEADER_LEN) {
      offset = YAR_HEADER_LEN;
      const mayBeHeader = unpackHeader(buffer);
      if (mayBeHeader) {
        header = mayBeHeader;
      }
    }

    if (buffer.length >= YAR_HEADER_LEN + header.bodyLen) {
      const response = unpackResponse(
        buffer.subarray(0, YAR_HEADER_LEN + header.bodyLen),
      );
      cb(header, response);
      offset = 0;
      buffer = null;
    }
  };
}

export { unpackHeader, packHeader, unpackResponse, createDataHandler };
