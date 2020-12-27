import * as fs from 'fs';
import { promisify } from 'util';

const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);
const readFile = promisify(fs.readFile);
const stat = promisify(fs.stat);
const rm = promisify(fs.rm);

export { writeFile, mkdir, readFile, stat, rm };
