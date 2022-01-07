import { JsMd5 } from './md5'
import { createHash } from 'crypto'

test('should output the same as node.js crypto module', () => {
  const str = 'hello，世界！'
  const hasher = JsMd5.new()
  hasher.update(str)
  expect(hasher.finish()).toEqual(createHash('md5').update(str).digest('hex'))
  hasher.free()
})
