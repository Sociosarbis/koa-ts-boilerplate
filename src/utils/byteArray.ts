export class ByteArray {
  private _buf: Buffer;
  private _offset: number;
  size: number;
  constructor(size: number) {
    this.size = size;
    this._buf = Buffer.alloc(size);
    this._offset = 0;
  }

  get buffer() {
    return this._buf;
  }

  peek(offset: number) {
    this._offset = offset;
  }

  skip(step: number) {
    this._offset += step;
  }

  writeUInt(val: number) {
    this._buf.writeUInt32BE(val, this._offset);
    this._offset += 4;
  }

  readUInt() {
    const num = this._buf.readUInt32BE(this._offset);
    this._offset += 4;
    return num;
  }

  readStr(length: number) {
    const buf = this._buf.subarray(this._offset, length).toString();
    this._offset += length;
    return buf;
  }

  writeStr(str: string, length: number) {
    this._buf.write(str, this._offset, length);
    this._offset += length;
  }

  static from(buf: Buffer, length: number, offset = 0) {
    const byteArray = new ByteArray(length);
    buf.copy(byteArray.buffer, 0, offset, length);
    return byteArray;
  }
}
