import * as wasm from './md5_bg.wasm';

const lTextDecoder =
  typeof TextDecoder === 'undefined'
    ? (0, module.require)('util').TextDecoder
    : TextDecoder;

let cachedTextDecoder = new lTextDecoder('utf-8', {
  ignoreBOM: true,
  fatal: true,
});

cachedTextDecoder.decode();

let cachegetUint8Memory0 = null;
function getUint8Memory0() {
  if (
    cachegetUint8Memory0 === null ||
    cachegetUint8Memory0.buffer !== wasm.memory.buffer
  ) {
    cachegetUint8Memory0 = new Uint8Array(wasm.memory.buffer);
  }
  return cachegetUint8Memory0;
}

function getStringFromWasm0(ptr, len) {
  return cachedTextDecoder.decode(getUint8Memory0().subarray(ptr, ptr + len));
}

let WASM_VECTOR_LEN = 0;

const lTextEncoder =
  typeof TextEncoder === 'undefined'
    ? (0, module.require)('util').TextEncoder
    : TextEncoder;

let cachedTextEncoder = new lTextEncoder('utf-8');

const encodeString =
  typeof cachedTextEncoder.encodeInto === 'function'
    ? function (arg, view) {
        return cachedTextEncoder.encodeInto(arg, view);
      }
    : function (arg, view) {
        const buf = cachedTextEncoder.encode(arg);
        view.set(buf);
        return {
          read: arg.length,
          written: buf.length,
        };
      };

function passStringToWasm0(arg, malloc, realloc) {
  if (realloc === undefined) {
    const buf = cachedTextEncoder.encode(arg);
    const ptr = malloc(buf.length);
    getUint8Memory0()
      .subarray(ptr, ptr + buf.length)
      .set(buf);
    WASM_VECTOR_LEN = buf.length;
    return ptr;
  }

  let len = arg.length;
  let ptr = malloc(len);

  const mem = getUint8Memory0();

  let offset = 0;

  for (; offset < len; offset++) {
    const code = arg.charCodeAt(offset);
    if (code > 0x7f) break;
    mem[ptr + offset] = code;
  }

  if (offset !== len) {
    if (offset !== 0) {
      arg = arg.slice(offset);
    }
    ptr = realloc(ptr, len, (len = offset + arg.length * 3));
    const view = getUint8Memory0().subarray(ptr + offset, ptr + len);
    const ret = encodeString(arg, view);

    offset += ret.written;
  }

  WASM_VECTOR_LEN = offset;
  return ptr;
}

let cachegetInt32Memory0 = null;
function getInt32Memory0() {
  if (
    cachegetInt32Memory0 === null ||
    cachegetInt32Memory0.buffer !== wasm.memory.buffer
  ) {
    cachegetInt32Memory0 = new Int32Array(wasm.memory.buffer);
  }
  return cachegetInt32Memory0;
}
/**
 */
export class JsMd5 {
  static __wrap(ptr) {
    const obj = Object.create(JsMd5.prototype);
    obj.ptr = ptr;

    return obj;
  }

  free() {
    const ptr = this.ptr;
    this.ptr = 0;

    wasm.__wbg_jsmd5_free(ptr);
  }
  /**
   * @returns {JsMd5}
   */
  static new() {
    var ret = wasm.jsmd5_new();
    return JsMd5.__wrap(ret);
  }
  /**
   * @param {string} s
   */
  update(s) {
    var ptr0 = passStringToWasm0(
      s,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc,
    );
    var len0 = WASM_VECTOR_LEN;
    wasm.jsmd5_update(this.ptr, ptr0, len0);
  }
  /**
   * @returns {string}
   */
  finish() {
    try {
      const retptr = wasm.__wbindgen_export_2.value - 16;
      wasm.__wbindgen_export_2.value = retptr;
      wasm.jsmd5_finish(retptr, this.ptr);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      return getStringFromWasm0(r0, r1);
    } finally {
      wasm.__wbindgen_export_2.value += 16;
      wasm.__wbindgen_free(r0, r1);
    }
  }
}

export const __wbindgen_throw = function (arg0, arg1) {
  throw new Error(getStringFromWasm0(arg0, arg1));
};
