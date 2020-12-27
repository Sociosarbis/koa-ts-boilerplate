import { dirname } from 'path';
import { createReadStream, createWriteStream, Stats } from 'fs';
import { mkdir, stat, rm } from '@/utils/io';

export class AppService {
  getHello() {
    return 'Hello';
  }

  async copyFile(src: string, destPath: string) {
    let stats: Stats = null;
    const dir = dirname(destPath);
    try {
      stats = await stat(dir);
    } catch (e) {}
    if (stats && !stats.isDirectory()) {
      await rm(dir);
    }
    if (!(stats && stats.isDirectory())) {
      await mkdir(dir, { recursive: true });
    }
    const writable = createWriteStream(destPath);
    createReadStream(src).pipe(writable);
    return new Promise((res) => {
      writable.on('finish', res);
    });
  }
}

export default new AppService();
