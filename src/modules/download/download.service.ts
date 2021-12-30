import { join } from 'path';
import { createReadStream, promises } from 'fs';
import { NotFoundError } from '@/base/exceptions';

export class DownloadService {
  basePath = join(__dirname, 'downloads');
  async requestFile(filename: string) {
    if (filename.length) {
      try {
        const p = join(this.basePath, filename);
        const stats = await promises.stat(p);
        if (stats.isFile()) {
          return createReadStream(p);
        }
      } catch (e) {
        console.log(e);
      }
    }
    throw new NotFoundError();
  }
}
