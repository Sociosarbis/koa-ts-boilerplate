import * as crypto from 'crypto';

const algorithms = 'des-ecb';
const placeHolderIv = Buffer.alloc(0);

function encrypt(buf: Buffer, key) {
  const pad = 8 - (buf.length % 8);
  buf = Buffer.concat([buf, Buffer.from(String.fromCharCode(pad).repeat(pad))]);
  const cipher = crypto.createCipheriv(algorithms, key, placeHolderIv);
  return Buffer.concat([cipher.update(buf), cipher.final()]).toString('base64');
}

function decrypt(data: string, key) {
  const buf = Buffer.from(data, 'base64');
  const decipher = crypto.createDecipheriv(algorithms, key, placeHolderIv);
  const decrypted = Buffer.concat([decipher.update(buf), decipher.final()]);
  const pad = Number(decrypted[decrypted.length - 1].toString());
  return decrypted.subarray(0, decrypted.length - pad);
}

export { encrypt, decrypt };
