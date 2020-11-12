import { Processor, Process } from '@/common/decorators/processor';
import { Job } from 'bull';
import * as fs from 'fs';
import { promisify } from 'util';

const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);
const readFile = promisify(fs.readFile);

@Processor('file')
export class FileProcessor {
  @Process('save')
  async handleSave(job: Job) {
    const { folder, files } = job.data;
    await mkdir(`./users/${folder}`, { recursive: true });
    if (files) {
      for (let i = 0; i < files.length; i++) {
        await writeFile(
          `./users/${folder}/${files[i].name}`,
          await readFile(files[i].path),
        );
      }
    }
  }
}
