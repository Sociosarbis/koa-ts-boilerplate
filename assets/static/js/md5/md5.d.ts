/* tslint:disable */
/* eslint-disable */
/**
*/
export class JsMd5 {
  free(): void;
/**
* @returns {JsMd5}
*/
  static new(): JsMd5;
/**
* @param {string} s
*/
  update(s: string): void;
/**
* @param {Uint8Array} s
*/
  update_u8(s: Uint8Array): void;
/**
* @returns {string}
*/
  finish(): string;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_jsmd5_free: (a: number) => void;
  readonly jsmd5_new: () => number;
  readonly jsmd5_update: (a: number, b: number, c: number) => void;
  readonly jsmd5_update_u8: (a: number, b: number, c: number) => void;
  readonly jsmd5_finish: (a: number, b: number) => void;
  readonly __wbindgen_malloc: (a: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number) => number;
  readonly __wbindgen_free: (a: number, b: number) => void;
}

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {InitInput | Promise<InitInput>} module_or_path
*
* @returns {Promise<InitOutput>}
*/
export default function init (module_or_path?: InitInput | Promise<InitInput>): Promise<InitOutput>;
        