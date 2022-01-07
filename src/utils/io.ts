import * as fs from 'fs'
import { promisify } from 'util'

const writeFile = promisify(fs.writeFile)
const mkdir = promisify(fs.mkdir)
const readFile = promisify(fs.readFile)
const fsStat = promisify(fs.stat)
const readdir = promisify(fs.readdir)
const rm = promisify(fs.unlink)

async function stat(src: string) {
  let stats: fs.Stats = null
  try {
    stats = await fsStat(src)
  } catch (e) {}
  return stats
}

export { writeFile, mkdir, readFile, stat, rm, readdir }
