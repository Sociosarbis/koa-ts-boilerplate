import { dirname, joinSafe } from 'upath'
import { createReadStream, createWriteStream, Stats } from 'fs'
import { mkdir, stat, rm, readdir } from '@/utils/io'

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

  async listFileStats(path: string) {
    const stats = await stat(path)
    if (stats && stats.isDirectory()) {
      const names = await readdir(path)
      try {
        return (
          await Promise.all(names.map((f) => stat(joinSafe(path, f))))
        ).map((s, i) => ({
          name: names[i],
          stat: s,
        }))
      } catch (e) {
        return []
      }
    }
  }

  writeFileSegment(src: string, dest: string, from: number) {
    return new Promise((res, rej) => {
      createReadStream(src).pipe(
        createWriteStream(dest, {
          start: from,
        })
          .on('finish', res)
          .on('error', rej),
      )
    })
  }

  getNameAndIndex(filename: string) {
    const [name, index] = filename.split('_')
    return {
      name,
      index: Number(index),
    }
  }
}

export default new AppService()
