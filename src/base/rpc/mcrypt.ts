import * as crypto from 'crypto';

const algorithms = 'des-ecb';
const placeHolderIv = Buffer.alloc(0);

function encrypt(buf: Buffer, key) {
  const cipher = crypto.createCipheriv(algorithms, key, placeHolderIv);
  return Buffer.concat([cipher.update(buf), cipher.final()]);
}

function decrypt(buf: Buffer, key) {
  const decipher = crypto.createDecipheriv(algorithms, key, placeHolderIv);
  return Buffer.concat([decipher.update(buf), decipher.final()]);
}

export { encrypt, decrypt };
