export function msgResponse(msg: string | Error) {
  return {
    msg: msg instanceof Error ? msg.message : msg,
  }
}
