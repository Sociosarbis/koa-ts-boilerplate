import { EventEmitter } from 'events';
import { YarHeader, YarResponse } from '../structs';

export class BaseConnection extends EventEmitter {
  protected _response: Promise<{ header: YarHeader; response: YarResponse }>;
  protected _responseResolver:
    | (({ header: YarHeader, response: YarResponse }) => void)
    | ((err: Error) => void);

  waitForResponse() {
    this._response = new Promise((res, rej) => {
      this._responseResolver = (i: any) => {
        if (i instanceof Error) rej(i);
        else res(i);
      };
    });
  }

  get response() {
    return this._response;
  }
}
