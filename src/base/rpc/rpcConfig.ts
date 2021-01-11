import * as ini from 'ini';
import * as path from 'path';
import { readFile } from '@/utils/io';

let rpcHostPath = '';
let rpcPath = '';
if (process.env.NODE_ENV !== 'production') {
  rpcHostPath = path.join(__dirname, '../../../config/rpc_host.ini');
  rpcPath = path.join(__dirname, '../../../config/rpc.ini');
}

type AppConfig = {
  host: string;
  port: number;
  url: string;
  pack: string;
  token: string;
  cipherKey: string;
  connTimeout: number;
  timeout: number;
  apis: Set<string>;
};

let apps: Record<string, AppConfig> = null;

const API_DEFINITION_REGEXP = /.+_(.+):(.+)/;
function isApiDefinition(str: string) {
  return API_DEFINITION_REGEXP.test(str);
}

const TOKEN_LINE_REGEXP = /des\[(\w+)\]/;
function isTokenLine(str: string) {
  return TOKEN_LINE_REGEXP.test(str);
}

function processRpcHostConfig(config: any) {
  if (!apps) apps = {};
  Object.keys(config).reduce((acc, key) => {
    const rawConfig = config[key];
    let token = '';
    let cipherKey = '';
    for (const k in rawConfig) {
      if (isTokenLine(k)) {
        token = TOKEN_LINE_REGEXP.exec(k)[1];
        cipherKey = rawConfig[k];
        break;
      }
    }
    acc[key] = {
      host: rawConfig.host,
      port: Number(rawConfig.port || 80),
      url: rawConfig.url,
      pack: rawConfig.pack,
      connTimeout: rawConfig.conn_time_out,
      timeout: rawConfig.timeout,
      token,
      cipherKey,
      apis: new Set(),
    };
    return acc;
  }, apps);
  return apps;
}

function processRpcConfig(config: any) {
  Object.keys(config).forEach((key) => {
    if (isApiDefinition(key)) {
      const match = API_DEFINITION_REGEXP.exec(key);
      const [name, app] = [match[1].trim(), match[2].trim()];
      if (app in apps) {
        apps[app].apis.add(name);
      }
    }
  });
}

async function resolveConfig() {
  await (apps ||
    readFile(rpcHostPath, { encoding: 'utf-8' })
      .then(ini.parse)
      .then(processRpcHostConfig)
      .then(() =>
        readFile(rpcPath, { encoding: 'utf-8' })
          .then(ini.parse)
          .then(processRpcConfig),
      ));
  return apps;
}

resolveConfig();

export { resolveConfig };
