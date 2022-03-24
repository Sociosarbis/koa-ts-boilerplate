export function errorResponse(msg: string | Error) {
  return {
    msg: msg instanceof Error ? msg.message : msg,
  }
}
