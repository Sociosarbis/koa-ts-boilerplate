import { dirname } from 'path'
import { createReadStream, createWriteStream, Stats } from 'fs'
import { mkdir, stat, rm } from '@/utils/io'

export class AppService {
  getHello() {
    return 'Hello'
  }

  async copyFile(src: string, destPath: string) {
    const dir = dirname(destPath)
    const stats: Stats = await stat(dir)
    if (stats && !stats.isDirectory()) {
      await rm(dir)
    }
    if (!(stats && stats.isDirectory())) {
      await mkdir(dir, { recursive: true })
    }
    const writable = createWriteStream(destPath)
    createReadStream(src).pipe(writable)
    return new Promise((res) => {
      writable.on('finish', res)
    })
  }
}

export default new AppService()
