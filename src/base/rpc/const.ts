import { JSONPackager, MSGPACKPackager } from './packagers';

const NODE_YAR_VERSION = '0.0.1';
const NODE_YAR_USER_AGENT = `Node Yar RPC-${NODE_YAR_VERSION}`;
const YAR_PROTOCOL_MAGIC_NUM = 0x80dfec60;

const YAR_PROVIDER = 'Yar(Node)-0.0.1';

const YAR_PACKAGER_LEN = 8;

const YAR_HEADER_LEN = 82;

const packagers = {
  JSON: JSONPackager,
  MSGPACK: MSGPACKPackager,
};

export {
  NODE_YAR_VERSION,
  NODE_YAR_USER_AGENT,
  YAR_PROTOCOL_MAGIC_NUM,
  YAR_PROVIDER,
  YAR_HEADER_LEN,
  YAR_PACKAGER_LEN,
  packagers,
};
