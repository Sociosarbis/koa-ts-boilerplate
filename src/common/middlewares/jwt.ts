import * as jwtMiddlew from 'koa-jwt'
import * as jwt from 'jsonwebtoken'

const SECRET_KEY = 'a cat came after a dog'

function sign(payload) {
  return jwt.sign(payload, SECRET_KEY)
}

export { sign }

export default jwtMiddlew({
  secret: SECRET_KEY,
})
